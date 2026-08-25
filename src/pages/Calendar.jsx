import { useMemo, useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import useEngagements from '@/hooks/useEngagements';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import { useAppSettings } from '@/hooks/useAppSettings';
import { resolveFeature } from '@/lib/permissions';
import { formatDate, formatTime } from '@/lib/speaking';
import { generateICSBatch, downloadICS } from '@/lib/icsExport';
import { data } from '@/lib/workspaceData';
import CalendarView from '@/components/speaking/CalendarView';
import DayPlanner from '@/components/speaking/DayPlanner';
import CalendarEventForm from '@/components/speaking/CalendarEventForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { todayStr } from '@/lib/calendarNav';
import useReflections from '@/hooks/useReflections';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import PageHeader from '@/components/speaking/PageHeader';

const pad2 = (v) => String(v).padStart(2, '0');

export default function Calendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, load: loadEngagements } = useEngagements();
  const { items: calEvents, loading: calEventsLoading, save: saveCalEvent, remove: removeCalEvent, load: loadCalEvents } = useCalendarEvents();
  const { settings } = useAppSettings();
  const { dateSet: reflectionDates, load: loadReflections } = useReflections();
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

  // --- reflection: navigate to the Faith page for that day (separate route) ---
  const openReflection = (dateKey) => navigate(`/faith?date=${dateKey}`);

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
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set('view', m);
      if (m === 'day') sp.set('calDate', todayStr());
      return sp;
    }, { replace: true });

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
      try { await data.entities.Notification.create({ engagement_id: planId, engagement_title: planTitle, speaking_date: planDateVal, speaking_time: item.start_time, window_label: 'Assigned to you', email_sent: false, read: false }); } catch {}
    }
    if (item.completed && !wasCompleted) {
      const assignerId = prev?.created_by_id || user?.id;
      const assigner = users.find((u) => u.id === assignerId);
      try { await data.entities.Notification.create({ engagement_id: planId, engagement_title: planTitle, speaking_date: item.completed_date || planDateVal, speaking_time: item.start_time, window_label: 'Completed', email_sent: false, read: false }); } catch {}
    }
    if (!item.id) { lastSaveWasNewRef.current = true; lastSaveDateRef.current = saved?.date || item.date || ''; }
  };

  const handleDeletePlan = async (id) => { await removeCalEvent(id); };
  const handleDeleteFuture = async (seriesId, afterDate) => {
    const future = calEvents.filter((e) => e.series_id === seriesId && e.date > afterDate);
    for (const e of future) { await removeCalEvent(e.id); }
  };
  const handleDeleteSeries = async (seriesId) => {
    const all = calEvents.filter((e) => e.series_id === seriesId);
    for (const e of all) { await removeCalEvent(e.id); }
  };

  const overlayCursor = calDate ? new Date(calDate + 'T00:00:00') : new Date();

  // Week navigation (Week View): shift the focused week by ±1, keeping view=week.
  const shiftWeek = (delta) => {
    const d = new Date(overlayCursor);
    d.setDate(d.getDate() + delta * 7);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.set('view', 'week'); sp.set('calDate', key); return sp; }, { replace: true });
  };
  const weekStartDate = useMemo(() => {
    const d = new Date(overlayCursor);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [overlayCursor]);
  const weekEndDate = useMemo(() => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStartDate]);
  const fmtShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekRangeLabel = `${fmtShort(weekStartDate)} - ${fmtShort(weekEndDate)}`;

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const shiftMonth = (delta) => {
    const d = new Date(overlayCursor);
    d.setMonth(d.getMonth() + delta);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.set('view', 'month'); sp.set('calDate', key); return sp; }, { replace: true });
  };
  const monthLabel = `${MONTHS[overlayCursor.getMonth()]} ${overlayCursor.getFullYear()}`;

  return (
    <main className="min-h-screen bg-background text-foreground pb-safe">
      <PageHeader title="Agenda" backTo="/" actions={
        <button
          onClick={() => downloadICS(generateICSBatch(items), 'all-engagements.ics')}
          disabled={!items.length}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />Export all
        </button>
      } />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-9">
        <PullToRefresh onRefresh={async () => { await loadEngagements(); await loadCalEvents(); await loadReflections(); }}>
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
          reflectionDates={reflectionDates}
        />

        {/* Layer 1: Week/Day overlay (Dialog on top of the month base) */}
        <Dialog open={view === 'month' || view === 'week' || view === 'day'} onOpenChange={(v) => !v && closeViewOverlay()}>
          <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-y-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:h-auto sm:max-h-[90dvh] sm:max-w-4xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
            <DialogHeader className="shrink-0 border-b border-border bg-card px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="font-display text-xl capitalize">{view} View</DialogTitle>
                <div className="flex gap-1">
                  {['month', 'week', 'day'].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleOverlayModeChange(m)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${view === m ? 'bg-[#D9A404] text-white' : 'bg-card text-foreground border border-border'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {view === 'week' && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => shiftWeek(-1)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-muted"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="min-w-[140px] text-center text-sm font-medium text-foreground">{weekRangeLabel}</span>
                  <button
                    type="button"
                    onClick={() => shiftWeek(1)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-muted"
                    aria-label="Next week"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
              {view === 'month' && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-muted"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="min-w-[140px] text-center text-sm font-medium text-foreground">{monthLabel}</span>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:bg-muted"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {view === 'month' ? (
              <CalendarView
                items={items}
                events={calEvents}
                controlledMode="month"
                hideHeader
                focusDate={calFocus}
                onSelect={(e) => navigate(`/?engagementId=${e.id}`)}
                onEventSelect={(p) => openPlanForm(p.id)}
                onSelectDay={openDayView}
                onSelectReflection={openReflection}
                canReflect={canReflect}
                reflectionDates={reflectionDates}
              />
            ) : (
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
                onGoToWeek={(d) => {
                  const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
                  setSearchParams((prev) => { const sp = new URLSearchParams(prev); sp.set('view', 'week'); sp.set('calDate', key); return sp; }, { replace: true });
                }}
                onSelectReflection={openReflection}
                canReflect={canReflect}
                reflectionDates={reflectionDates}
              />
            )}
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
          onDeleteSeries={handleDeleteSeries}
        />

        <div className="h-28 lg:hidden" />
        </PullToRefresh>
      </div>
    </main>
  );
}