import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import RoomList from '@/components/chat/RoomList';
import { Input } from '@/components/ui/input';
import ConversationView from '@/components/chat/ConversationView';
import NewChatDialog from '@/components/chat/NewChatDialog';
import { setOpenChatRoom } from '@/lib/chatSession';
import BottomTabBar from '@/components/speaking/BottomTabBar';
import useHistoryModal from '@/hooks/useHistoryModal';

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState('');
  const requestClose = useHistoryModal(!!selected, () => setSelected(null));

  useEffect(() => {
    setOpenChatRoom(selected?.id || null);
  }, [selected?.id]);

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
          const next = prev.map((r) => (r.id === event.data.id ? event.data : r));
          return [...next].sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''));
        }
        if (event.type === 'delete') {
          return prev.filter((r) => r.id !== event.data.id);
        }
        return prev;
      });
      if (event.type === 'update' && selected && event.data.id === selected.id) {
        setSelected(event.data);
      }
      if (event.type === 'delete' && selected && event.data.id === selected.id) {
        setSelected(null);
      }
    });
    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selected?.id]);

  const handleCreated = (room) => {
    setNewOpen(false);
    if (!rooms.some((r) => r.id === room.id)) setRooms((prev) => [room, ...prev]);
    setSelected(room);
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
            <RoomList
              rooms={rooms}
              loading={loading}
              selectedId={selected?.id}
              onSelect={setSelected}
              onNew={() => setNewOpen(true)}
              currentUserId={user.id}
              query={query}
            />
          </div>

          <div className={`flex-1 flex-col ${selected ? 'flex' : 'hidden lg:flex'}`}>
            {selected ? (
              <ConversationView room={selected} user={user} onBack={requestClose} query={query} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a conversation
              </div>
            )}
          </div>
        </div>

        <div className="h-28 shrink-0 lg:hidden" />
      </div>

      <BottomTabBar />
      <NewChatDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={handleCreated}
        currentUser={user}
        existingRooms={rooms}
      />
    </main>
  );
}