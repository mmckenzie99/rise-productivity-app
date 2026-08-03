import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';

export default function ConversationView({ room, user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMessages([]);
    base44.entities.ChatMessage
      .filter({ room_id: room.id }, '-created_date', 200)
      .then((msgs) => {
        if (!mounted) return;
        setMessages([...(msgs || [])].reverse());
        setLoading(false);
      })
      .catch(() => mounted && setLoading(false));

    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.room_id && event.data.room_id !== room.id) return;
      if (event.type === 'create') {
        setMessages((prev) => (prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]));
      } else if (event.type === 'update') {
        setMessages((prev) => prev.map((m) => (m.id === event.data.id ? event.data : m)));
      } else if (event.type === 'delete') {
        setMessages((prev) => prev.filter((m) => m.id !== event.data.id));
      }
    });

    return () => {
      mounted = false;
      unsub && unsub();
    };
  }, [room.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({
        room_id: room.id,
        body: text,
        author_id: user.id,
        author_name: user.full_name || user.email,
        participant_ids: room.participant_ids,
      });
      await base44.entities.ChatRoom.update(room.id, {
        last_message: text.slice(0, 120),
        last_message_at: new Date().toISOString(),
        last_sender_name: user.full_name || user.email,
      });
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{room.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {(room.participant_names || []).length} participant{(room.participant_names || []).length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
        {(room.participant_names || []).map((name, i) => {
          const me = (room.participant_ids || [])[i] === user.id;
          return (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                me ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {me ? 'You' : name}
            </span>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello!</div>
        ) : (
          messages.map((m) => {
            const mine = m.author_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-1.5 text-sm ${
                    mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[10px] font-semibold opacity-80">{m.author_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`mt-0.5 text-right text-[9px] ${
                      mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {m.created_date ? format(parseISO(m.created_date), 'h:mm a') : ''}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button
          onClick={send}
          disabled={sending || !input.trim()}
          size="icon"
          className="h-9 w-9 rounded-full"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}