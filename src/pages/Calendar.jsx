import { useMemo, useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import useEngagements from '@/hooks/useEngagements';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import { useAppSettings } from '@/hooks/useAppSettings';
import { resolveFeature } from '@/lib/permissions';
import { formatDate, formatTime } from '@/lib/speaking';
import { generateICSBatch, downloadICS } from '@/lib/icsExport';
import { deleteLinkedConversations } from '@/lib/chat';
import CalendarView from '@/components/speaking/CalendarView';
import DayPlanner from '@/components/speaking/DayPlanner';
import CalendarEventForm from '@/components/speaking/CalendarEventForm';
import DailyReflectionOverlay from '@/components/reflection/DailyReflectionOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { todayStr } from '@/lib/calendarNav';

const pad2 = (v) => String(v).padStart(2, '0');

export default function Calendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, load: loadEngagements } = useEngagements();
  const { items: calEvents, loading: calEventsLoading, save: saveCalEvent, remove: removeCalEvent } = useCalendarEvents();
  const { settings } = useAppSettings();
  const [users, setUsers] = useState([]);
  const lastSaveWasNewRef = useRef(false);
  const lastSaveDateRef = useRef('');

  useEffect(() => {
    (async () => { try { const us = await base44.entities.User.list(); setUsers(us); } catch {} })();
  }, []);

  const commentUsers = useMemo(() => users.filter((u) => resolveFeature(u, settings, 'can_comment')), [users, settings]);
  const assignableUsers = useMemo(() => users.filter((u) => resolveFeature(u, settings, 'can_be_assigned')), [users, settings]);
  const canReflect = resolveFeature(user, settings, 'can_view_reflections');

  // --- URL-driven overlay state (derived from search params) ---
  const view = searchParams.get('view'); // 'week' | 'day' | null (null = month base)
  const planIdParam = searchParams.get('planId');
  const calDate = searchParams.get('calDate');
  const planDate = searchParams.get('planDate');
  const planStart = searchParams.get('planStart');
  const planEnd = searchParams.get('planEnd');
  const reflectionDate = searchParams.get('reflectionDate');

  const calFocus = useMemo(() => (calDate ? { date: calDate } : null), [calDate]);
  const calEventForm = !planIdParam
    ? false
    : planIdParam === 'new'
      ? { date: planDate || calDate || '', start_time: planStart || '', end_time: planEnd || '' }
      : (calEvents.find((e) => e.id === planIdParam) || false);

  // Stale deep-link cleanup: clear planId when the referenced plan doesn't
  // exist after data has loaded.
  const clearParam = (name) =>
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.delete(name); return sp; }, { replace: true });
  useEffect(() => {
    if (calEventsLoading) return;
    if (planIdParam && planIdParam !== 'new' && !calEvents.some((e) => e.id === planIdParam)) clearParam('planId');
  }, [planIdParam, calEvents, calEventsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- close handlers (parameter surgery: delete only this overlay's params) ---
  // Close Week/Day overlay: delete only `view`, preserve calDate and planId.
  const closeViewOverlay = () =>
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.delete('view'); return sp; }, { replace: true });

  // Close Form overlay: delete only planId-related params, preserve view and calDate.
  // After saving a NEW plan, focus the calendar on the new plan's date.
  const closePlanForm = () => {
    const d = lastSaveWasNewRef.current ? lastSaveDateRef.current : '';
    lastSaveWasNewRef.current = false;
    lastSaveDateRef.current = '';
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      ['planId', 'planDate', 'planStart', 'planEnd'].forEach((p) => sp.delete(p));
      if (d) sp.set('calDate', d);
      return sp;
    }, { replace: true });
  };

  // --- reflection overlay (push: own history entry, back returns to calendar) ---
  const openReflection = (dateKey) =>
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.set('reflectionDate', dateKey); return sp; });
  const closeReflection = () =>
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.delete('reflectionDate'); return sp; }, { replace: true });

  // --- navigation (push, so the back stack preserves the return path) ---
  // Base CalendarView mode toggle → opens/closes the Week/Day overlay.
  const handleModeChange = (m) =>
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      if (m === 'month') sp.delete('view');
      else sp.set('view', m);
      return sp;
    });

  // Overlay mode toggle → switch between week and day (replace, no new history entry).
  const handleOverlayModeChange = (m) =>
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.set('view', m); return sp; }, { replace: true });

  // Day cell click in month view → open day overlay focused on that date.
  const openDayView = (dateKey) =>
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.set('view', 'day'); sp.set('calDate', dateKey); return sp; });

  // Open plan form (preserves the current view overlay).
  const openPlanForm = (planId, extra = {}) =>
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set('planId', planId);
      Object.entries(extra).forEach(([k, v]) => { if (v) sp.set(k, v); });
      return sp;
    });

  // --- save with notifications (moved from Home) ---
  const saveCalEventWithNotifs = async (item) => {
    const prev = item.id ? calEvents.find((e) => e.id === item.id) : null;
    const wasAssigned = prev?.assignee_id;
    const wasCompleted = prev?.completed;
    if (prev) { item.was_edited = true; item.was_rescheduled = !!(prev.was_rescheduled || prev.date !== item.date); }
    const saved = await saveCalEvent(item);
    const planId = saved?.id || item.id;
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const planTitle = item.title || 'Plan';
    const planDateVal = item.date;
    const safeTitle = esc(planTitle);
    if (item.assignee_id && item.assignee_id !== wasAssigned) {
      const assignee = users.find((u) => u.id === item.assignee_id);
      try { await base44.entities.Notification.create({ engagement_id: planId, engagement_title: planTitle, speaking_date: planDateVal, speaking_time: item.start_time, window_label: 'Assigned to you', email_sent: false, read: false }); } catch {}
      if (assignee?.email) { try { await base44.integrations.Core.SendEmail({ to: assignee.email, subject: `New plan assigned: ${safeTitle}`, body: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B"><h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B">A plan was assigned to you</h2><p style="font-size:16px"><strong>${safeTitle}</strong>${planDateVal ? ` on ${formatDate(planDateVal)}` : ''}${item.start_time ? ` at ${formatTime(item.start_time)}` : ''}.</p><p style="font-size:13px;color:#5A6781">Open the RISE calendar to view details and mark it complete.</p></div>` }); } catch {} }
    }
    if (item.completed && !wasCompleted) {
      const assignerId = prev?.created_by_id || user?.id;
      const assigner = users.find((u) => u.id === assignerId);
      try { await base44.entities.Notification.create({ engagement_id: planId, engagement_title: planTitle, speaking_date: item.completed_date || planDateVal, speaking_time: item.start_time, window_label: 'Completed', email_sent: false, read: false }); } catch {}
      if (assigner?.email) { try { await base44.integrations.Core.SendEmail({ to: assigner.email, subject: `Plan completed: ${safeTitle}`, body: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B"><h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B">A plan was completed</h2><p style="font-size:16px"><strong>${safeTitle}</strong> has been marked complete.</p></div>` }); } catch {} }
    }
    if (!item.id) { lastSaveWasNewRef.current = true; lastSaveDateRef.current = saved?.date || item.date || ''; }
  };

  const handleDeletePlan = async (id) => { await removeCalEvent(id); await deleteLinkedConversations(id, 'plan'); };
  const handleDeleteFuture = async (seriesId, afterDate) => {
    const future = calEvents.filter((e) => e.series_id === seriesId && e.date > afterDate);
    for (const e of future) { await removeCalEvent(e.id); await deleteLinkedConversations(e.id, 'plan'); }
  };

  const overlayCursor = calDate ? new Date(calDate + 'T00:00:00') : new Date();

  return (
    <main className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-9">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="font-display text-2xl font-semibold">Calendar</h1>
          <button
            onClick={() => downloadICS(generateICSBatch(items), 'all-engagements.ics')}
            disabled={!items.length}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />Export all
          </button>
        </div>

        {/* Base: Month view (always rendered) */}
        <CalendarView
          items={items}
          events={calEvents}
          controlledMode="month"
          focusDate={calFocus}
          onSelect={(e) => navigate(`/?engagementId=${e.id}`)}
          onEventSelect={(p) => openPlanForm(p.id)}
          onSelectDay={openDayView}
          onModeChange={handleModeChange}
          onSelectReflection={openReflection}
          canReflect={canReflect}
        />

        {/* Layer 1: Week/Day overlay (Dialog on top of the month base) */}
        <Dialog open={view === 'week' || view === 'day'} onOpenChange={(v) => !v && closeViewOverlay()}>
          <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-y-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:h-auto sm:max-h-[90dvh] sm:max-w-4xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
            <DialogHeader className="shrink-0 border-b border-border bg-card px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="font-display text-xl capitalize">{view} View</DialogTitle>
                <div className="flex gap-1">
                  {['month', 'week', 'day'].map((m) => (
                    <button
                      key={m}
                      onClick={() => (m === 'month' ? closeViewOverlay() : handleOverlayModeChange(m))}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${view === m ? 'bg-[#D9A404] text-white' : 'bg-card text-foreground border border-border'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <DayPlanner
              items={items}
              events={calEvents}
              mode={view}
              cursor={overlayCursor}
              onSelect={(e) => navigate(`/?engagementId=${e.id}`)}
              onEventSelect={(p) => openPlanForm(p.id)}
              onAddSlot={(date, time) => {
                const [h, mi] = time.split(':').map(Number);
                const end = h * 60 + mi + 60;
                const eh = Math.floor(end / 60) % 24, em = end % 60;
                openPlanForm('new', { planDate: date, planStart: time, planEnd: `${pad2(eh)}:${pad2(em)}` });
              }}
              onGoToDate={(d) => {
                const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
                setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.set('view', 'day'); sp.set('calDate', key); return sp; }, { replace: true });
              }}
              onSelectReflection={openReflection}
              canReflect={canReflect}
            />
            </div>
          </DialogContent>
        </Dialog>

        {/* Layer 2: Form overlay (Dialog on top of the view overlay if present) */}
        <CalendarEventForm
          open={!!calEventForm}
          item={calEventForm === true ? null : calEventForm}
          admins={commentUsers}
          assignableUsers={assignableUsers}
          currentUserId={user?.id}
          onClose={closePlanForm}
          onSave={saveCalEventWithNotifs}
          onDelete={handleDeletePlan}
          onDeleteFuture={handleDeleteFuture}
        />

        {/* Layer 3: Reflection overlay (personal editor + transparency stamp) */}
        <DailyReflectionOverlay
          open={!!reflectionDate}
          dateKey={reflectionDate}
          engagements={items}
          onClose={closeReflection}
        />

        <div className="h-28 lg:hidden" />
      </div>
    </main>
  );
}