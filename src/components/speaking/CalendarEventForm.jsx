import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EMPTY = {
  title: '',
  date: '',
  all_day: true,
  end_date: '',
  start_time: '',
  end_time: '',
  category: 'Personal',
  notes: '',
  assignee_id: '',
  assignee_name: '',
  completed: false,
  completed_date: '',
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function CalendarEventForm({ open, item, admins, currentUserId, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm({ ...EMPTY, ...(item || {}) }), [item, open]);

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
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const assignees = (admins || []).filter((u) => u.id !== currentUserId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{item?.id ? 'Edit' : 'New'} plan</DialogTitle>
        </DialogHeader>
        {form.category === 'Personal' && (
          <div className="flex items-center gap-2 rounded-md bg-[#EDE3F8] px-3 py-2 text-[#5B2DA0]">
            <span className="h-2 w-2 rounded-full bg-[#5B2DA0]" />
            <span className="text-xs font-semibold">Personal plan</span>
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="What do you need to do?"
              className="border-[#D6DAE3]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="border-[#D6DAE3]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger className="border-[#D6DAE3]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-[#D6DAE3] bg-[#F7F8FA] px-3 py-2">
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
                className="border-[#D6DAE3]"
              />
              <p className="text-[11px] text-[#5A6781]">Leave blank for a single day. Set a later date to span multiple days.</p>
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
                  className="border-[#D6DAE3]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input
                  type="time"
                  value={form.end_time || ''}
                  onChange={(e) => set('end_time', e.target.value)}
                  className="border-[#D6DAE3]"
                />
              </div>
            </div>
          )}

          {form.category === 'Work' && (
            <div className="space-y-1.5">
              <Label>Assign to (administrator)</Label>
              <Select value={form.assignee_id || 'none'} onValueChange={onAssigneeChange}>
                <SelectTrigger className="border-[#D6DAE3]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No one</SelectItem>
                  {assignees.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.assignee_id && (
            <div className="flex items-center justify-between rounded-md border border-[#D6DAE3] bg-[#F7F8FA] px-3 py-2">
              <div>
                <Label className="text-sm">Mark complete</Label>
                <p className="text-xs text-[#5A6781]">Notifies whoever assigned this plan.</p>
              </div>
              <Switch checked={!!form.completed} onCheckedChange={toggleComplete} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="border-[#D6DAE3]"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saving} className="bg-[#D9A404] hover:bg-[#B89003]">
              {saving ? 'Saving…' : 'Save plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}