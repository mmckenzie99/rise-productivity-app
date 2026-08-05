import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import useFeatureFlag from '@/hooks/useFeatureFlag';
import RoomList from '@/components/chat/RoomList';
import ArchivedRoomList from '@/components/chat/ArchivedRoomList';
import { Input } from '@/components/ui/input';
import ConversationView from '@/components/chat/ConversationView';
import NewChatDialog from '@/components/chat/NewChatDialog';
import { setOpenChatRoom } from '@/lib/chatSession';
import { deleteSingleConversation, unarchiveChatRoom } from '@/lib/chat';

export default function Chat() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingLink, setPendingLink] = useState(null);
  const [prefillLink, setPrefillLink] = useState(null);
  const [tab, setTab] = useState('active');
  const canStart = useFeatureFlag('can_start_chats');

  const selected = rooms.find((r) => r.id === roomId) || null;
  const activeRooms = useMemo(() => rooms.filter((r) => !((r.archived_by || []).includes(user.id))), [rooms, user.id]);
  const archivedRooms = useMemo(() => rooms.filter((r) => (r.archived_by || []).includes(user.id)), [rooms, user.id]);

  useEffect(() => {
    setOpenChatRoom(selected?.id || null);
  }, [selected?.id]);

  // Ghost guard: if the route points at a room not in our list, fetch it from
  // the DB. A 404/not-found means it was deleted → return to the room list so a
  // stale ghost can never trap the user in an empty conversation.
  useEffect(() => {
    if (!roomId) return;
    if (rooms.some((r) => r.id === roomId)) return;
    let cancelled = false;
    (async () => {
      try {
        const room = await base44.entities.ChatRoom.get(roomId);
        if (cancelled) return;
        if (room) setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [room, ...prev]));
        else navigate('/chat', { replace: true });
      } catch {
        if (!cancelled) navigate('/chat', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [roomId, rooms, navigate]);

  useEffect(() => {
    const lt = searchParams.get('linkType');
    const lid = searchParams.get('linkedId');
    if (lt && lid) setPendingLink({ type: lt, id: lid });
  }, [searchParams]);

  // Resolve a deep link by querying the DB directly for a room linked to this
  // item that includes the current user — never trust the in-memory rooms list,
  // which may hold a stale ghost after a deletion.
  useEffect(() => {
    if (!pendingLink || !user?.id) return;
    let cancelled = false;
    (async () => {
      let active = null;
      let archived = null;
      try {
        const found = await base44.entities.ChatRoom.filter({ linked_id: pendingLink.id });
        const mine = (found || []).filter((r) => (r.participant_ids || []).includes(user.id));
        active = mine.find((r) => !((r.archived_by || []).includes(user.id))) || null;
        archived = mine.find((r) => (r.archived_by || []).includes(user.id)) || null;
      } catch { active = null; archived = null; }
      if (cancelled) return;
      setSearchParams((prev) => { prev.delete('linkType'); prev.delete('linkedId'); return prev; }, { replace: true });
      if (active) {
        setRooms((prev) => (prev.some((r) => r.id === active.id) ? prev : [active, ...prev]));
        navigate(`/chat/${active.id}`, { replace: true });
      } else if (archived) {
        // The item's only room is archived (for me) — restore it for me only,
        // preserving history, rather than creating a duplicate.
        try {
          const updated = await unarchiveChatRoom(archived.id);
          setRooms((prev) => prev.map((r) => (r.id === archived.id ? (updated || r) : r)));
        } catch {}
        navigate(`/chat/${archived.id}`, { replace: true });
      } else {
        setPrefillLink(pendingLink);
        setNewOpen(true);
      }
      setPendingLink(null);
    })();
    return () => { cancelled = true; };
  }, [pendingLink, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRooms = async () => {
    const list = await base44.entities.ChatRoom.list('-last_message_at', 100);
    setRooms(list || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadRooms();
    const unsub = base44.entities.ChatRoom.subscribe((event) => {
      setRooms((prev) => {
        if (event.type === 'create') {
          if (prev.some((r) => r.id === event.data.id)) return prev;
          return [event.data, ...prev];
        }
        if (event.type === 'update') {
          const next = prev.map((r) => {
            if (r.id !== event.data.id) return r;
            // Skip stale realtime events (e.g. an out-of-order pre-image)
            // that would revert a fresher local state right after a toggle.
            if (r.updated_date && event.data.updated_date && r.updated_date > event.data.updated_date) return r;
            return event.data;
          });
          return [...next].sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''));
        }
        if (event.type === 'delete') {
          return prev.filter((r) => r.id !== event.data.id);
        }
        return prev;
      });
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCreated = (room) => {
    setNewOpen(false);
    setPrefillLink(null);
    if (!rooms.some((r) => r.id === room.id)) setRooms((prev) => [room, ...prev]);
    navigate(`/chat/${room.id}`, { replace: true });
  };

  const handleUnarchive = async (room) => {
    try {
      await unarchiveChatRoom(room.id);
      // Optimistically drop the caller from archived_by so the room leaves
      // the Archived tab instantly, then refetch the authoritative list so the
      // tabs re-filter and a stale realtime event can't strand the room there.
      setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, archived_by: (r.archived_by || []).filter((id) => id !== user.id) } : r)));
      setTab('active');
      await loadRooms();
    } catch (e) {
      window.alert(`Restore failed: ${e?.message || e}`);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm('Permanently delete this conversation and all its messages for everyone? This cannot be undone.')) return;
    try {
      await deleteSingleConversation(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      if (selected?.id === room.id) navigate('/chat', { replace: true });
    } catch (e) {
      window.alert(`Delete failed: ${e?.message || e}`);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background pt-safe pb-safe">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-background text-foreground pt-safe">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 sm:px-6">
        <div className="flex items-center gap-3 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-semibold">Chat</h1>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations or messages…"
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mb-4 flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card">
          <div
            className={`w-full flex-col border-r border-border lg:w-80 lg:shrink-0 ${
              selected ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab('active')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition ${tab === 'active' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Conversations
              </button>
              <button
                onClick={() => setTab('archived')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition ${tab === 'archived' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Archived{archivedRooms.length > 0 ? ` (${archivedRooms.length})` : ''}
              </button>
            </div>
            {tab === 'active' ? (
              <RoomList
                rooms={activeRooms}
                loading={loading}
                selectedId={selected?.id}
                onSelect={(room) => navigate(`/chat/${room.id}`)}
                onNew={() => setNewOpen(true)}
                currentUserId={user.id}
                query={query}
                canStart={canStart}
              />
            ) : (
              <ArchivedRoomList
                rooms={archivedRooms}
                onSelect={(room) => navigate(`/chat/${room.id}`)}
                onUnarchive={handleUnarchive}
                onDelete={handleDeleteRoom}
                currentUserId={user.id}
                isOwner={!!user.is_owner}
              />
            )}
          </div>

          <div className={`flex-1 flex-col ${selected ? 'flex' : 'hidden lg:flex'}`}>
            {selected ? (
              <ConversationView room={selected} user={user} onBack={() => navigate('/chat')} query={query} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a conversation
              </div>
            )}
          </div>
        </div>

        <div className="h-28 shrink-0 lg:hidden" />
      </div>

      <NewChatDialog
        open={newOpen}
        onClose={() => { setNewOpen(false); setPrefillLink(null); }}
        onCreated={handleCreated}
        currentUser={user}
        existingRooms={rooms}
        initialLinkType={prefillLink?.type}
        initialLinkedId={prefillLink?.id}
      />
    </main>
  );
}