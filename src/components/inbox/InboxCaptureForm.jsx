import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import DatePicker from '@/components/speaking/DatePicker';
import TimePicker from '@/components/speaking/TimePicker';
import { nowISO, toLocalInput, fromLocalInput } from '@/lib/inbox';

const ENTITY_OPTIONS = [
  { value: 'None', label: 'None / Uncategorized' },
  { value: 'Task', label: 'Task' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Trip', label: 'Trip' },
];

export default function InboxCaptureForm({ open, onClose, onSave }) {
  const [messageText, setMessageText] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [entityType, setEntityType] = useState('None');
  const [messageDate, setMessageDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMessageText('');
      setSenderName('');
      setSenderNumber('');
      setEntityType('None');
      setMessageDate(toLocalInput(nowISO()));
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
        entity_type: entityType,
        message_date: fromLocalInput(messageDate),
        reminder_at: reminderAt,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Quick Capture</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
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
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="border-border bg-card">
                <SelectValue placeholder="Pick a type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Received <span className="font-normal text-muted-foreground">(when the message arrived)</span>
            </Label>
            <Input
              type="datetime-local"
              value={messageDate}
              onChange={(e) => setMessageDate(e.target.value)}
              className="border-border bg-card"
            />
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

          <DialogFooter className="flex-row justify-end gap-2">
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