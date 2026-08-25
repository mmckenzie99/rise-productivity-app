import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import ResponsiveSelect from '@/components/speaking/ResponsiveSelect';
import DatePicker from '@/components/speaking/DatePicker';
import TimePicker from '@/components/speaking/TimePicker';
import RecurrenceEditor from '@/components/speaking/RecurrenceEditor';
import { localDate, localTime, fromLocalInput } from '@/lib/inbox';
import { CalendarPlus, Bell, Repeat } from 'lucide-react';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_REC = {
  recurrence_freq: 'weekly',
  recurrence_interval: 1,
  recurrence_weekdays: [],
  recurrence_monthly_mode: 'day_of_month',
  recurrence_end_mode: 'never',
  recurrence_end_count: 5,
  recurrence_end_until: '',
};

const recFromRule = (ruleStr) => {
  const base = { ...DEFAULT_REC };
  if (!ruleStr) return base;
  try {
    const r = JSON.parse(ruleStr);
    return {
      ...base,
      recurrence_freq: r.freq || 'weekly',
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

export default function TaskForm({ open, item, plans, onClose, onSave, onSchedule }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [notes, setNotes] = useState('');
  const [linkedPlanId, setLinkedPlanId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [rec, setRec] = useState(DEFAULT_REC);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(item?.title || '');
      setCategory(item?.category || 'Personal');
      setDueDate(item?.due_date ? localDate(item.due_date) : '');
      setDueTime(item?.due_date ? localTime(item.due_date) : '');
      setReminderDate(item?.reminder_at ? localDate(item.reminder_at) : '');
      setReminderTime(item?.reminder_at ? localTime(item.reminder_at) : '');
      setNotes(item?.notes || '');
      setLinkedPlanId(item?.linked_plan_id || '');
      setIsRecurring(!!item?.is_recurring);
      setRec(recFromRule(item?.recurrence_rule));
      setSaving(false);
    }
  }, [open, item]);

  const setRecField = (k, v) => setRec((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const due = dueDate ? fromLocalInput(`${dueDate}T${dueTime || '09:00'}`) : '';
      const reminder = reminderDate ? fromLocalInput(`${reminderDate}T${reminderTime || '09:00'}`) : '';
      const recurring = isRecurring && rec.recurrence_freq && rec.recurrence_freq !== 'none';
      const taskFields = {
        ...(item?.id ? { id: item.id } : {}),
        title: title.trim(),
        category,
        due_date: due,
        reminder_at: reminder,
        notes: notes.trim(),
        is_done: item?.is_done ?? false,
        linked_plan_id: linkedPlanId || '',
        converted_to_plan_id: item?.converted_to_plan_id || '',
        is_recurring: recurring,
        recurrence_rule: recurring ? JSON.stringify({
          freq: rec.recurrence_freq,
          interval: Number(rec.recurrence_interval) || 1,
          weekdays: rec.recurrence_weekdays || [],
          monthly_mode: rec.recurrence_monthly_mode || 'day_of_month',
          end_mode: rec.recurrence_end_mode || 'never',
          end_count: Number(rec.recurrence_end_count) || 1,
          end_until: rec.recurrence_end_until || '',
        }) : '',
      };

      // When recurring and not yet linked to a plan, ask the parent to create a
      // matching recurring CalendarEvent series; it returns the first occurrence id.
      let planForm = null;
      if (recurring && !linkedPlanId) {
        const planDate = dueDate || todayStr();
        planForm = {
          title: title.trim(),
          date: planDate,
          all_day: !dueTime,
          end_date: '',
          start_time: dueTime || '',
          end_time: '',
          category,
          location_type: 'In-person',
          notes: notes.trim(),
          assignee_id: '',
          assignee_name: '',
          completed: false,
          completed_date: '',
          recurrence_freq: rec.recurrence_freq,
          recurrence_interval: rec.recurrence_interval,
          recurrence_weekdays: rec.recurrence_weekdays,
          recurrence_monthly_mode: rec.recurrence_monthly_mode,
          recurrence_end_mode: rec.recurrence_end_mode,
          recurrence_end_count: rec.recurrence_end_count,
          recurrence_end_until: rec.recurrence_end_until,
        };
      }

      await onSave(taskFields, planForm);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex left-0 right-0 top-0 max-h-[calc(100dvh_-_7.5rem_-_env(safe-area-inset-bottom))] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:left-[50%] sm:top-[50%] sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-border px-6 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-3">
            <DialogTitle className="font-display text-xl">{item?.id ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
                className="border-border bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <ResponsiveSelect
                value={category}
                onValueChange={setCategory}
                options={[
                  { value: 'Personal', label: 'Personal' },
                  { value: 'Work', label: 'Work' },
                ]}
                placeholder="Personal"
                triggerClassName="border-border bg-card"
                label="Category"
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Due <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DatePicker value={dueDate} onChange={setDueDate} placeholder="Pick a date" />
                <TimePicker value={dueTime} onChange={setDueTime} placeholder="Pick a time" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                Reminder <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DatePicker value={reminderDate} onChange={setReminderDate} placeholder="Pick a date" />
                <TimePicker value={reminderTime} onChange={setReminderTime} placeholder="Pick a time" />
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                  Recurring
                </span>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </label>
              {isRecurring && (
                <RecurrenceEditor form={rec} set={setRecField} />
              )}
              {isRecurring && (
                <p className="text-[11px] text-muted-foreground">
                  Saves a matching recurring plan on the Agenda.
                </p>
              )}
            </div>

            {plans && plans.length > 0 && (
              <div className="space-y-1.5">
                <Label>
                  Linked plan <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <ResponsiveSelect
                  value={linkedPlanId}
                  onValueChange={setLinkedPlanId}
                  options={plans.map((p) => ({ value: p.id, label: `${p.title}${p.date ? ` · ${p.date}` : ''}` }))}
                  placeholder="None"
                  triggerClassName="border-border bg-card"
                  label="Linked plan"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add details…"
                className="min-h-[100px] border-border bg-card"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t border-border bg-background px-6 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {onSchedule && item?.id && !item.is_done && !item.converted_to_plan_id && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onSchedule(item)}
                className="mr-auto border-border bg-card hover:border-primary hover:text-primary"
              >
                <CalendarPlus className="h-4 w-4" />
                Schedule as Plan
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="border-border bg-card">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#D9A404] hover:bg-[#B89003]">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}