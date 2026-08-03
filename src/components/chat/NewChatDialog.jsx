import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import ResponsiveSelect from '@/components/speaking/ResponsiveSelect';
import useEngagements from '@/hooks/useEngagements';
import useTrips from '@/hooks/useTrips';
import { formatPlaces } from '@/lib/trips';

export default function NewChatDialog({ open, onClose, onCreated, currentUser, existingRooms }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const { items: engagements } = useEngagements();
  const { items: trips } = useTrips();
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [linkType, setLinkType] = useState('none');
  const [linkedId, setLinkedId] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsersLoading(true);
    base44.entities.User
      .list()
      .then((u) => setUsers((u || []).filter((x) => x.id !== currentUser.id)))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [open, currentUser.id]);

  useEffect(() => {
    if (!open) {
      setSelectedUsers(new Set());
      setLinkType('none');
      setLinkedId('');
      setTitle('');
      setTopic('');
    }
  }, [open]);

  const nameMap = useMemo(() => {
    const m = { [currentUser.id]: currentUser.full_name || currentUser.email };
    users.forEach((u) => {
      m[u.id] = u.full_name || u.email;
    });
    return m;
  }, [users, currentUser]);

  const toggleUser = (id) => {
    setSelectedUsers((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = async () => {
    if (selectedUsers.size === 0) return;
    const partIds = Array.from(new Set([currentUser.id, ...Array.from(selectedUsers)]));

    if (linkType === 'none' && partIds.length === 2) {
      const existing = existingRooms.find(
        (r) =>
          r.type === 'direct' &&
          r.participant_ids &&
          r.participant_ids.length === 2 &&
          partIds.every((id) => r.participant_ids.includes(id))
      );
      if (existing) {
        onCreated(existing);
        return;
      }
    }

    let type = 'direct';
    let linked_id;
    let linked_title;
    let resolvedTitle;

    if (linkType === 'engagement') {
      type = 'engagement';
      const eng = engagements.find((e) => e.id === linkedId);
      linked_id = linkedId;
      linked_title = eng?.title || eng?.place || 'Engagement';
      resolvedTitle = linked_title;
    } else if (linkType === 'trip') {
      type = 'trip';
      const t = trips.find((x) => x.id === linkedId);
      linked_id = linkedId;
      linked_title = t ? formatPlaces(t) : 'Trip';
      resolvedTitle = linked_title;
    } else {
      resolvedTitle =
        title.trim() ||
        (partIds.length === 2
          ? nameMap[partIds.find((i) => i !== currentUser.id)]
          : `Group · ${partIds.length}`);
    }

    setCreating(true);
    try {
      const room = await base44.entities.ChatRoom.create({
        title: resolvedTitle,
        topic: topic.trim(),
        type,
        participant_ids: partIds,
        participant_names: partIds.map((id) => nameMap[id] || 'Unknown'),
        linked_id,
        linked_title,
      });
      onCreated(room);
    } finally {
      setCreating(false);
    }
  };

  const canCreate = selectedUsers.size > 0 && (linkType === 'none' || !!linkedId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">Participants</Label>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Loading users…</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other users available to message.</p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2.5 rounded px-1 py-1 hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedUsers.has(u.id)}
                      onCheckedChange={() => toggleUser(u.id)}
                    />
                    <span className="text-sm text-foreground">{u.full_name || u.email}</span>
                    <span className="ml-auto text-xs capitalize text-muted-foreground">{u.role}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Link to (optional)</Label>
            <ResponsiveSelect
              value={linkType}
              onValueChange={(v) => {
                setLinkType(v);
                setLinkedId('');
              }}
              options={[
                { value: 'none', label: 'No link' },
                { value: 'engagement', label: 'Engagement' },
                { value: 'trip', label: 'Trip' },
              ]}
              placeholder="No link"
              label="Link to (optional)"
            />
          </div>

          {linkType === 'engagement' && (
            <ResponsiveSelect
              value={linkedId}
              onValueChange={setLinkedId}
              options={engagements.map((e) => ({
                value: e.id,
                label: e.title || e.place || 'Untitled',
              }))}
              placeholder="Select engagement"
              label="Select engagement"
            />
          )}

          {linkType === 'trip' && (
            <ResponsiveSelect
              value={linkedId}
              onValueChange={setLinkedId}
              options={trips.map((t) => ({
                value: t.id,
                label: formatPlaces(t),
              }))}
              placeholder="Select trip"
              label="Select trip"
            />
          )}

          {linkType === 'none' && selectedUsers.size > 1 && (
            <div>
              <Label className="mb-1.5 block text-sm">Group name (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Group chat"
              />
            </div>
          )}

          <div>
            <Label className="mb-1.5 block text-sm">Topic (optional)</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Q3 travel planning"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={create} disabled={!canCreate || creating}>
            {creating ? 'Creating…' : 'Start chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}