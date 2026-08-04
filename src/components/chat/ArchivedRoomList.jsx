import { useMemo, useState } from 'react';
import { Archive, Search, MessageCircle, MapPin, Plane, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const roomIcon = (room) => {
  if (room.type === 'engagement') return <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />;
  if (room.type === 'trip') return <Plane className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />;
  if (room.type === 'plan') return <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />;
  return <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />;
};

export default function ArchivedRoomList({ rooms, onSelect, currentUserId }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return rooms;
    return rooms.filter((r) =>
      [r.title, r.linked_title || '', r.topic || '', ...(r.participant_names || []), r.last_message || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [rooms, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Archive className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Archived</span>
      </div>
      <div className="relative m-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or linked item…"
          className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-2 text-xs"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            <Archive className="mx-auto mb-2 h-8 w-8 opacity-40" />
            {query ? 'No archived conversations match your search.' : 'No archived conversations.'}
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
                className="flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left transition hover:bg-accent"
              >
                {roomIcon(r)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{otherName}</span>
                    {r.last_message_at && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {format(parseISO(r.last_message_at), 'MMM d')}
                      </span>
                    )}
                  </div>
                  {r.linked_title && r.type !== 'direct' && (
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{r.linked_title}</span>
                  )}
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.last_message || 'No messages yet'}
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