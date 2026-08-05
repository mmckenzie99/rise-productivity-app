import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

// Single-select user picker for adding one participant to an existing room.
// Reuses the checkbox-list pattern from NewChatDialog. The actual append +
// system message + notification happen server-side via addChatParticipant, so
// the client never patches participant_ids directly.
export default function AddParticipantDialog({ open, onClose, room, currentUser, onAdded }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    setSelectedId('');
    base44.functions
      .invoke('listParticipants')
      .then((res) => {
        const roster = (res?.data?.users || []).filter(
          (x) => x.id !== currentUser.id && !(room.participant_ids || []).includes(x.id)
        );
        setUsers(roster);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, currentUser.id, room.id, room.participant_ids]);

  const add = async () => {
    if (!selectedId) return;
    setAdding(true);
    setError('');
    try {
      const res = await base44.functions.invoke('addChatParticipant', {
        roomId: room.id,
        newUserId: selectedId,
      });
      const data = res?.data || {};
      if (data.ok) {
        onAdded();
      } else if (data.added) {
        // Participant added but a secondary step failed — refresh AND alert loudly.
        onAdded();
        window.alert(
          `Participant added, but a step failed: ${(data.errors || []).join('; ')}. The conversation has been refreshed.`
        );
      } else {
        setError(data.error || 'Failed to add participant');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to add participant');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other users available to add.</p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2.5 rounded px-1 py-1 hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedId === u.id}
                    onCheckedChange={(v) => setSelectedId(v ? u.id : '')}
                  />
                  <span className="text-sm text-foreground">{u.name}</span>
                  <span className="ml-auto text-xs capitalize text-muted-foreground">{u.role}</span>
                </label>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={add} disabled={!selectedId || adding}>
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}