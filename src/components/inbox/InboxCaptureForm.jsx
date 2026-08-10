import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DatePicker from '@/components/speaking/DatePicker';
import TimePicker from '@/components/speaking/TimePicker';
import OptionWheelPicker from '@/components/speaking/OptionWheelPicker';
import { nowISO, toLocalInput, fromLocalInput } from '@/lib/inbox';

const ENTITY_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'General Conference', label: 'General Conference' },
  { value: 'Division', label: 'Division' },
  { value: 'Union', label: 'Union' },
  { value: 'Conference', label: 'Conference' },
  { value: 'Church', label: 'Church' },
  { value: 'School', label: 'School' },
  { value: 'Ministry', label: 'Ministry' },
];

const CATEGORY_OPTIONS = [
  { value: 'None', label: 'None / Uncategorized' },
  { value: 'Task', label: 'Task' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Trip', label: 'Trip' },
];

export default function InboxCaptureForm({ open, onClose, onSave }) {
  const [messageText, setMessageText] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [organizationEntity, setOrganizationEntity] = useState('None');
  const [category, setCategory] = useState('None');
  const [messageDate, setMessageDate] = useState('');
  const [messageTime, setMessageTime] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMessageText('');
      setSenderName('');
      setSenderNumber('');
      setOrganizationEntity('None');
      setCategory('None');
      const nowLocal = toLocalInput(nowISO());
      setMessageDate(nowLocal.slice(0, 10));
      setMessageTime(nowLocal.slice(11, 16));
      setReminderDate('');
      setReminderTime('');
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSaving(true);
    try {
      const reminderAt = reminderDate && reminderTime
        ? fromLocalInput(`${reminderDate}T${reminderTime}`)
        : '';
      await onSave({
        message_text: messageText.trim(),
        sender_name: senderName.trim(),
        sender_number: senderNumber.trim(),
        organization_entity: organizationEntity,
        entity_type: category,
        message_date: fromLocalInput(`${messageDate}T${messageTime || '09:00'}`),
        reminder_at: reminderAt,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
<DialogContent className="flex !inset-x-0 !top-0 max-h-[calc(100dvh_-_7.5rem_-_env(safe-area-inset-bottom))] max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:!left-[50%] sm:!top-[50%] sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:rounded-lg">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-border px-6 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-3">
            <DialogTitle className="font-display text-xl">Quick Capture</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Paste the message here…"
                className="min-h-[120px] border-border bg-card"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  Name <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Contact name"
                  className="border-border bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Number <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="Phone number"
                  className="border-border bg-card"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Entity</Label>
              <OptionWheelPicker
                options={ENTITY_OPTIONS}
                value={organizationEntity}
                onChange={setOrganizationEntity}
                label="Entity"
                placeholder="Pick an entity"
                className="border-border bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <OptionWheelPicker
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={setCategory}
                label="Category"
                placeholder="Pick a category"
                className="border-border bg-card"
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Received <span className="font-normal text-muted-foreground">(when the message arrived)</span>
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DatePicker
                  value={messageDate}
                  onChange={setMessageDate}
                  placeholder="Pick a date"
                  label="Received date"
                />
                <TimePicker
                  value={messageTime}
                  onChange={setMessageTime}
                  placeholder="Pick a time"
                  label="Received time"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Remind me on <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DatePicker
                  value={reminderDate}
                  onChange={setReminderDate}
                  placeholder="Pick a date"
                />
                <TimePicker
                  value={reminderTime}
                  onChange={setReminderTime}
                  placeholder="Pick a time"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background px-6 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
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