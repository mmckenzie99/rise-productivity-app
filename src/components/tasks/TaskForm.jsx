import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import DatePicker from '@/components/speaking/DatePicker';
import TimePicker from '@/components/speaking/TimePicker';
import { localDate, localTime, fromLocalInput } from '@/lib/inbox';
import { CalendarPlus } from 'lucide-react';

export default function TaskForm({ open, item, plans, onClose, onSave, onSchedule }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [notes, setNotes] = useState('');
  const [linkedPlanId, setLinkedPlanId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(item?.title || '');
      setDueDate(item?.due_date ? localDate(item.due_date) : '');
      setDueTime(item?.due_date ? localTime(item.due_date) : '');
      setNotes(item?.notes || '');
      setLinkedPlanId(item?.linked_plan_id || '');
      setSaving(false);
    }
  }, [open, item]);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const due = dueDate ? fromLocalInput(`${dueDate}T${dueTime || '09:00'}`) : '';
      await onSave({
        ...(item?.id ? { id: item.id } : {}),
        title: title.trim(),
        due_date: due,
        notes: notes.trim(),
        is_done: item?.is_done ?? false,
        linked_plan_id: linkedPlanId || '',
        converted_to_plan_id: item?.converted_to_plan_id || '',
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
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
              <Label>
                Due <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DatePicker value={dueDate} onChange={setDueDate} placeholder="Pick a date" />
                <TimePicker value={dueTime} onChange={setDueTime} placeholder="Pick a time" />
              </div>
            </div>

            {plans && plans.length > 0 && (
              <div className="space-y-1.5">
                <Label>
                  Linked plan <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Select value={linkedPlanId} onValueChange={setLinkedPlanId}>
                  <SelectTrigger className="border-border bg-card">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}{p.date ? ` · ${p.date}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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