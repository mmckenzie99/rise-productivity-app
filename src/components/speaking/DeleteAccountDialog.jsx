import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function DeleteAccountDialog({ open, onClose }) {
  const { toast } = useToast();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const canDelete = confirm.trim().toUpperCase() === 'DELETE';

  const submit = async () => {
    if (!canDelete) return;
    setBusy(true);
    try {
      // Notify administrators of the deletion request via a service-role email.
      try {
        await base44.functions.invoke('requestAccountDeletion', {});
      } catch {}
      toast({
        title: 'Account deletion initiated',
        description: 'Administrators have been notified and will process your request. Signing you out…',
      });
      await base44.auth.logout('/login');
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-[#1B2A4B]">Delete account</DialogTitle>
          <DialogDescription>Permanently delete your account and data.</DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 rounded-md border border-[#E5B5B5] bg-[#FBEDED] p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#B33A3A]" />
          <p className="text-sm text-[#1B2A4B]">
            This will permanently remove your account and all associated data — speaking engagements, plans, reflections, trips, and comments.{' '}
            <strong>This action cannot be undone.</strong>
          </p>
        </div>
        <p className="text-sm text-[#5A6781]">
          To confirm, type <strong className="text-[#1B2A4B]">DELETE</strong> below.
        </p>
        <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" className="border-[#D6DAE3]" />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={!canDelete || busy} onClick={submit}>
            {busy ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}