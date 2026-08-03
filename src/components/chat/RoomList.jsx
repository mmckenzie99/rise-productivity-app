import { MessageCircle, Plus, MapPin, Plane } from 'lucide-react';
import Highlight from '@/components/chat/Highlight';
import { format, parseISO } from 'date-fns';

const roomIcon = (room) => {
  if (room.type === 'engagement') return <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />;
  if (room.type === 'trip') return <Plane className="mt-0.5 h-4 w-4 shrink-0 text-primary" />;
  return <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />;
};

export default function RoomList({ rooms, loading, selectedId, onSelect, onNew, currentUserId, query }) {
  const q = (query || '').trim().toLowerCase();
  const filtered = q
    ? rooms.filter((r) => {
        const hay = [r.title, ...(r.participant_names || []), r.last_message || ''].join(' ').toLowerCase();
        return hay.includes(q);
      })
    : rooms;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-sm font-semibold text-foreground">Conversations</span>
        <button
          onClick={onNew}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90"
          title="New chat"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
            {q ? 'No conversations match your search.' : <>No conversations yet.<br />Tap + to start one.</>}
          </div>
        ) : (
          filtered.map((r) => {
            const otherName =
              r.type === 'direct'
                ? (r.participant_names || [])
                    .filter((n, i) => (r.participant_ids || [])[i] !== currentUserId)
                    .join(', ') || r.title
                : r.title;
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className={`flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left transition hover:bg-accent ${
                  selectedId === r.id ? 'bg-accent' : ''
                }`}
              >
                {roomIcon(r)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground"><Highlight text={otherName} query={query} /></span>
                    {r.last_message_at && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {format(parseISO(r.last_message_at), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.last_sender_name ? `${(r.last_sender_name || '').split(' ')[0]}: ` : ''}
                    <Highlight text={r.last_message || 'No messages yet'} query={query} />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}