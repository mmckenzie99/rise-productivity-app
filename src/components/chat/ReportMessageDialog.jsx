import { useState } from 'react';
import { Flag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const REASONS = ['Spam', 'Harassment', 'Inappropriate content', 'Other'];

export default function ReportMessageDialog({ open, onClose, message_id, reported_user_id, room_id, currentUser }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setReason(''); setNote(''); };

  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await base44.entities.Report.create({
        message_id,
        reported_user_id,
        room_id,
        reporter_id: currentUser.id,
        reason: note.trim() ? `${reason} — ${note.trim()}` : reason,
      });
      toast({ title: 'Report submitted', description: 'Thank you. Our team will review it.' });
      close();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Report failed', description: e?.message || String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Flag className="h-4 w-4 text-primary" /> Report message</DialogTitle>
          <DialogDescription>Help us keep the community safe. Choose a reason for reporting this message.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value={r} id={`reason-${r}`} />
                <span className="text-sm text-foreground">{r}</span>
              </label>
            ))}
          </RadioGroup>
          <div className="space-y-1.5">
            <Label htmlFor="report-note" className="text-xs text-muted-foreground">Additional details (optional)</Label>
            <Textarea
              id="report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context for our review team…"
              className="min-h-[72px] resize-none text-sm"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={close} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={!reason || submitting}>
            {submitting ? 'Submitting…' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}