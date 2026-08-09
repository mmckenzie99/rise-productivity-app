import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { nowISO, toLocalInput, fromLocalInput } from '@/lib/inbox';

export default function InboxCaptureForm({ open, onClose, onSave }) {
  const [messageText, setMessageText] = useState('');
  const [sender, setSender] = useState('');
  const [messageDate, setMessageDate] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMessageText('');
      setSender('');
      setMessageDate(toLocalInput(nowISO()));
      setReminderAt('');
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSaving(true);
    try {
      await onSave({
        message_text: messageText.trim(),
        sender: sender.trim(),
        message_date: fromLocalInput(messageDate),
        reminder_at: fromLocalInput(reminderAt),
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
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Phone number or contact name"
              className="border-border bg-card"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Received</Label>
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
              <Input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
                className="border-border bg-card"
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