import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ResponsiveSelect from './ResponsiveSelect';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import RichTextEditor from './RichTextEditor';
import { MessageCircle, Check, X, Trash2, AlertTriangle, CalendarRange, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import useIsDarkMode from '@/hooks/useIsDarkMode';
import RecurrenceEditor from './RecurrenceEditor';
import ScrollFade from './ScrollFade';
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection';
import { useImportantFlags } from '@/lib/ImportantFlagsProvider';
import { generateOccurrences } from '@/lib/recurrence';
import { useAuth } from '@/lib/AuthContext';
import useFeatureFlag, { usePlanFlag } from '@/hooks/useFeatureFlag';

const EMPTY = {
  title: '',
  date: '',
  all_day: true,
  end_date: '',
  start_time: '',
  end_time: '',
  category: 'Personal',
  location_type: 'In-person',
  notes: '',
  assignee_id: '',
  assignee_name: '',
  completed: false,
  completed_date: '',
  recurrence_freq: 'none',
  recurrence_interval: 1,
  recurrence_weekdays: [],
  recurrence_monthly_mode: 'day_of_month',
  recurrence_end_mode: 'never',
  recurrence_end_count: 5,
  recurrence_end_until: '',
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const genSeriesId = () => `ser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const buildRule = (f) => JSON.stringify({
  freq: f.recurrence_freq || 'none',
  interval: Number(f.recurrence_interval) || 1,
  weekdays: f.recurrence_weekdays || [],
  monthly_mode: f.recurrence_monthly_mode || 'day_of_month',
  end_mode: f.recurrence_end_mode || 'never',
  end_count: Number(f.recurrence_end_count) || 1,
  end_until: f.recurrence_end_until || '',
});

const prefillFromRule = (base, ruleStr) => {
  if (!ruleStr) return base;
  try {
    const r = JSON.parse(ruleStr);
    return {
      ...base,
      recurrence_freq: r.freq || 'none',
      recurrence_interval: r.interval ?? 1,
      recurrence_weekdays: r.weekdays || [],
      recurrence_monthly_mode: r.monthly_mode || 'day_of_month',
      recurrence_end_mode: r.end_mode || 'never',
      recurrence_end_count: r.end_count ?? 5,
      recurrence_end_until: r.end_until || '',
    };
  } catch {
    return base;
  }
};

export default function CalendarEventForm({ open, item, admins, assignableUsers, currentUserId, onClose, onSave, onDelete, onDeleteFuture, onDeleteSeries }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [editScope, setEditScope] = useState('single');
  const [dateError, setDateError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const isDark = useIsDarkMode();
  const themeCls = isDark ? 'dark' : '';
  const { user } = useAuth();
  const userCanComment = useFeatureFlag('can_comment');
  const canCreatePersonal = usePlanFlag('can_create_personal_plans');
  const canCreateWork = usePlanFlag('can_create_work_plans');
  const canStart = useFeatureFlag('can_start_chats');
  const isAdmin = user?.role === 'admin';
  const { flaggedKeys, toggle } = useImportantFlags();
  const assignees = (assignableUsers || []).filter((u) => u.id !== currentUserId);

  useEffect(() => {
    const base = { ...EMPTY, ...(item || {}) };
    if (!item?.id && !canCreatePersonal && canCreateWork) base.category = 'Work';
    if (!item?.id && !canCreateWork && canCreatePersonal) base.category = 'Personal';
    setForm(prefillFromRule(base, item?.recurrence_rule));
    setEditScope('single');
  }, [item, open, canCreatePersonal, canCreateWork]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleComplete = (v) => {
    setForm((f) => ({ ...f, completed: v, completed_date: v ? todayStr() : '' }));
  };

  const onAssigneeChange = (v) => {
    const assignee = (admins || []).find((u) => u.id === v);
    setForm((f) => ({ ...f, assignee_id: v === 'none' ? '' : v, assignee_name: assignee ? assignee.full_name || assignee.email : '' }));
  };

  // Delete scope handler. The AlertDialog auto-closes on Action tap; this runs
  // the actual deletion, then closes the plan form so the existing
  // subscribe/load refreshes month/week/day views.
  const runDelete = async (scope) => {
    setDeleting(true);
    try {
      if (scope === 'single') {
        await onDelete?.(item.id);
      } else if (scope === 'future') {
        // "This & all future": remove future occurrences (handleDeleteFuture)
        // then the current occurrence (onDelete) — both clean linked chats.
        if (onDeleteFuture) await onDeleteFuture(item.series_id, item.date);
        await onDelete?.(item.id);
      } else if (scope === 'series') {
        if (onDeleteSeries) await onDeleteSeries(item.series_id);
      }
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (form.category === 'Personal' && !canCreatePersonal) { setCategoryError("You don't have permission to create personal plans."); setSaving(false); return; }
    if (form.category === 'Work' && !canCreateWork) { setCategoryError("You don't have permission to create work plans."); setSaving(false); return; }
    if (!form.date) { setDateError('Please pick a date.'); setSaving(false); return; }
    const rule = buildRule(form);
    try {
      if (!item?.id) {
        const isRecurring = form.recurrence_freq && form.recurrence_freq !== 'none';
        const seriesId = isRecurring ? genSeriesId() : '';
        const occurrences = generateOccurrences(form);
        for (const occ of occurrences) {
          await onSave({ ...occ, series_id: seriesId, recurrence_rule: seriesId ? rule : '' });
        }
      } else if (item.series_id && editScope === 'future') {
        const seriesId = item.series_id;
        if (onDeleteFuture) await onDeleteFuture(seriesId, form.date);
        const occurrences = generateOccurrences(form);
        await onSave({ ...occurrences[0], id: item.id, series_id: seriesId, recurrence_rule: rule });
        for (let i = 1; i < occurrences.length; i++) {
          await onSave({ ...occurrences[i], series_id: seriesId, recurrence_rule: rule });
        }
      } else {
        const { recurrence_freq, recurrence_interval, recurrence_weekdays, recurrence_monthly_mode, recurrence_end_mode, recurrence_end_count, recurrence_end_until, ...rest } = form;
        await onSave({ ...rest, id: item.id });
      }
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const isSeriesOccurrence = !!item?.series_id;
  const showRecurrence = !item?.id || (isSeriesOccurrence && editScope === 'future');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:h-[90dvh] sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 pb-3 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:border-0">
          <DialogTitle className="font-display text-xl">{item?.id ? 'Edit' : 'New'} plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <ScrollFade className="space-y-4 overscroll-contain px-6 pb-4">
        {form.category === 'Personal' && (
          <div className="flex items-center gap-2 rounded-md bg-[#EDE3F8] px-3 py-2 text-[#5B2DA0]">
            <span className="h-2 w-2 rounded-full bg-[#5B2DA0]" />
            <span className="text-xs font-semibold">Personal plan</span>
          </div>
        )}
        {isSeriesOccurrence && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
            <Label className="shrink-0 text-sm font-medium">Apply changes to</Label>
            <ResponsiveSelect
              value={editScope}
              onValueChange={setEditScope}
              options={[
                { value: 'single', label: 'Only this instance' },
                { value: 'future', label: 'This & all future' },
              ]}
              triggerClassName="border-border h-9 min-w-[10rem]"
            />
          </div>
        )}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="What do you need to do?"
              className="border-border"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <DatePicker
                value={form.date || ''}
                onChange={(v) => { set('date', v); setDateError(''); }}
                className="border-border"
                label="Date"
              />
              {dateError && <p className="text-xs font-medium text-destructive">{dateError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <ResponsiveSelect value={form.category} onValueChange={(v) => { set('category', v); setCategoryError(''); }} options={[{ value: 'Personal', label: 'Personal', disabled: !canCreatePersonal }, { value: 'Work', label: 'Work', disabled: !canCreateWork }]} triggerClassName="border-border" />
              {categoryError && <p className="text-xs font-medium text-destructive">{categoryError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <ResponsiveSelect value={form.location_type} onValueChange={(v) => set('location_type', v)} options={[{ value: 'In-person', label: 'In-person' }, { value: 'Online', label: 'Online' }]} triggerClassName="border-border" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
            <Label className="text-sm">All day</Label>
            <Switch checked={!!form.all_day} onCheckedChange={(v) => setForm((f) => ({ ...f, all_day: v, start_time: v ? '' : f.start_time, end_time: v ? '' : f.end_time, end_date: v ? f.end_date : '' }))} />
          </div>
          {form.all_day && (
            <div className="space-y-1.5">
              <Label>End date (optional)</Label>
              <DatePicker
                value={form.end_date || ''}
                min={form.date || undefined}
                onChange={(v) => set('end_date', v)}
                className="border-border"
                label="End date"
              />
              <p className="text-[11px] text-muted-foreground">Leave blank for a single day. Set a later date to span multiple days.</p>
            </div>
          )}
          {!form.all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <TimePicker
                  value={form.start_time || ''}
                  onChange={(v) => set('start_time', v)}
                  className="border-border"
                  label="Start"
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <TimePicker
                  value={form.end_time || ''}
                  onChange={(v) => set('end_time', v)}
                  className="border-border"
                  label="End"
                />
              </div>
            </div>
          )}

          {showRecurrence && <RecurrenceEditor form={form} set={set} />}

          {form.category === 'Work' && (
            <div className="space-y-1.5">
              <Label>Assign to (administrator)</Label>
              <ResponsiveSelect
                value={form.assignee_id || 'none'}
                onValueChange={onAssigneeChange}
                options={[{ value: 'none', label: 'No one' }, ...assignees.map((u) => ({ value: u.id, label: u.full_name || u.email }))]}
                triggerClassName="border-border"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
            <div>
              <Label className="text-sm">Mark complete</Label>
              <p className="text-xs text-muted-foreground">{form.assignee_id ? 'Notifies whoever assigned this plan.' : 'Mark this plan as finished.'}</p>
            </div>
            <Switch checked={!!form.completed} onCheckedChange={toggleComplete} />
          </div>

          {item?.id && (
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
              <div>
                <Label className="text-sm">Flag as important</Label>
                <p className="text-xs text-muted-foreground">Surfaces in Inbox → Important items.</p>
              </div>
              <Switch checked={flaggedKeys.has(`CalendarEvent:${item.id}`)} onCheckedChange={() => toggle('CalendarEvent', item.id, form.title || 'Plan')} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <RichTextEditor
              value={form.notes || ''}
              onChange={(v) => set('notes', v)}
              placeholder="Add notes — URLs become clickable links automatically"
            />
          </div>

          {item?.id && <LinkedTasksSection planId={item.id} />}

          {/* chat removed */}
        </ScrollFade>
        <DialogFooter className="shrink-0 flex flex-row items-center justify-end gap-2 border-t border-border bg-card px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            {item?.id && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    aria-label="Delete plan"
                    title="Delete"
                    disabled={deleting || saving}
                    className="h-11 w-11 p-0 [&_svg]:size-5"
                  >
                    <Trash2 />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className={cn('z-[60] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-md flex-col gap-0 overflow-hidden rounded-none p-0 sm:rounded-lg', themeCls)}>
                  <AlertDialogHeader className="shrink-0 gap-1 border-b border-border px-5 pb-3 pt-[calc(1.25rem+env(safe-area-inset-top))]">
                    <AlertDialogTitle className="flex items-center gap-2 font-display text-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Delete plan
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isSeriesOccurrence
                        ? 'This plan is part of a recurring series. Choose what to delete.'
                        : 'Delete this plan?'} This can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-5 pt-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    {isSeriesOccurrence ? (
                      <>
                        <AlertDialogAction onClick={() => runDelete('single')} aria-label="Delete only this occurrence" className="inline-flex h-11 md:h-11 w-full items-center justify-center gap-2 whitespace-nowrap bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          <Trash2 className="h-4 w-4" />This event
                        </AlertDialogAction>
                        <AlertDialogAction onClick={() => runDelete('future')} aria-label="Delete this and all future occurrences" className="inline-flex h-11 md:h-11 w-full items-center justify-center gap-2 whitespace-nowrap bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          <CalendarRange className="h-4 w-4" />This & future
                        </AlertDialogAction>
                        <AlertDialogAction onClick={() => runDelete('series')} aria-label="Delete all occurrences in this series" className="inline-flex h-11 md:h-11 w-full items-center justify-center gap-2 whitespace-nowrap bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          <Repeat className="h-4 w-4" />All events
                        </AlertDialogAction>
                      </>
                    ) : (
                      <AlertDialogAction onClick={() => runDelete('single')} aria-label="Delete plan" className="inline-flex h-11 md:h-11 w-full items-center justify-center gap-2 whitespace-nowrap bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        <Trash2 className="h-4 w-4" />Delete
                      </AlertDialogAction>
                    )}
                    <div className="mt-1 border-t border-border pt-3">
                      <AlertDialogCancel autoFocus aria-label="Cancel" className="mt-0 inline-flex h-11 md:h-11 w-full items-center justify-center gap-2 whitespace-nowrap border border-border bg-card text-foreground hover:bg-accent">
                        <X className="h-4 w-4" />Cancel
                      </AlertDialogCancel>
                    </div>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" size="icon" aria-label="Cancel" title="Cancel" onClick={onClose} className="h-11 w-11 p-0 [&_svg]:size-5">
              <X />
            </Button>
            <Button type="submit" size="icon" disabled={saving} aria-label="Save plan" title="Save plan" className="h-11 w-11 p-0 [&_svg]:size-5 bg-[#D9A404] hover:bg-[#B89003]">
              <Check />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}