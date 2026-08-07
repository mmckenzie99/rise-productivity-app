import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ResponsiveSelect from './ResponsiveSelect';
import RichTextEditor from './RichTextEditor';
import { MessageCircle, Check, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RecurrenceEditor from './RecurrenceEditor';
import ScrollFade from './ScrollFade';
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

export default function CalendarEventForm({ open, item, admins, assignableUsers, currentUserId, onClose, onSave, onDelete, onDeleteFuture }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [editScope, setEditScope] = useState('single');
  const { user } = useAuth();
  const userCanComment = useFeatureFlag('can_comment');
  const canCreatePersonal = usePlanFlag('can_create_personal_plans');
  const canCreateWork = usePlanFlag('can_create_work_plans');
  const canStart = useFeatureFlag('can_start_chats');
  const isAdmin = user?.role === 'admin';
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

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (form.category === 'Personal' && !canCreatePersonal) { window.alert("You don't have permission to create personal plans."); setSaving(false); return; }
    if (form.category === 'Work' && !canCreateWork) { window.alert("You don't have permission to create work plans."); setSaving(false); return; }
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
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] flex-col overflow-hidden bg-card p-0 sm:max-w-md">
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
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <ResponsiveSelect value={form.category} onValueChange={(v) => set('category', v)} options={[{ value: 'Personal', label: 'Personal', disabled: !canCreatePersonal }, { value: 'Work', label: 'Work', disabled: !canCreateWork }]} triggerClassName="border-border" />
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
              <Input
                type="date"
                value={form.end_date || ''}
                min={form.date || undefined}
                onChange={(e) => set('end_date', e.target.value)}
                className="border-border"
              />
              <p className="text-[11px] text-muted-foreground">Leave blank for a single day. Set a later date to span multiple days.</p>
            </div>
          )}
          {!form.all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={form.start_time || ''}
                  onChange={(e) => set('start_time', e.target.value)}
                  className="border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input
                  type="time"
                  value={form.end_time || ''}
                  onChange={(e) => set('end_time', e.target.value)}
                  className="border-border"
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

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <RichTextEditor
              value={form.notes || ''}
              onChange={(v) => set('notes', v)}
              placeholder="Add notes — use the link button to insert a clickable link…"
            />
          </div>

          {item?.id && canStart && (
            <button
              type="button"
              onClick={() => { navigate(`/chat?linkType=plan&linkedId=${item.id}`); }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#1B2A4B] bg-[#1B2A4B] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2A3D6B]"
            >
              <MessageCircle className="h-4 w-4" />Chat about this plan
            </button>
          )}
        </ScrollFade>
        <DialogFooter className="shrink-0 flex flex-row items-center justify-end gap-2 border-t border-border bg-card px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            {item?.id && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                aria-label="Delete"
                title="Delete"
                onClick={async () => {
                  if (window.confirm('Delete this plan?')) {
                    setSaving(true);
                    try { await onDelete(item.id); } finally { setSaving(false); onClose(); }
                  }
                }}
                className="h-11 w-11 p-0 [&_svg]:size-5"
              >
                <Trash2 />
              </Button>
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