import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Paperclip, FileText, Download, X, Archive, RotateCcw, Trash2, UserPlus } from 'lucide-react';
import AddParticipantDialog from '@/components/chat/AddParticipantDialog';
import { useNavigate } from 'react-router-dom';
import Highlight from '@/components/chat/Highlight';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';

export default function ConversationView({ room, user, onBack, onArchive, onUnarchive, onDelete, query }) {
  const navigate = useNavigate();
  const isParticipant = (room.participant_ids || []).includes(user.id);
  const isArchivedForMe = (room.archived_by || []).includes(user.id);
  const canDelete = isParticipant && (room.started_by_id === user.id || !!user.is_owner);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingTopic, setEditingTopic] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [topicDraft, setTopicDraft] = useState('');
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // "Way back": for a room linked to an engagement/trip/plan, jump back to it.
  const itemLabel = room.type === 'engagement' ? 'Engagement'
    : room.type === 'trip' ? 'Trip'
    : room.type === 'plan' ? 'Plan' : '';
  const backToItem = room.linked_id && itemLabel
    ? room.type === 'engagement' ? `/?engagementId=${room.linked_id}`
      : room.type === 'trip' ? `/?trips=open&tripId=${room.linked_id}`
      : `/calendar?planId=${room.linked_id}`
    : null;

  // For plan-linked rooms, focus the weekly calendar on that plan's date.
  const goBackToItem = async () => {
    if (!room.linked_id || !itemLabel) return;
    if (room.type === 'engagement') {
      navigate(`/?engagementId=${room.linked_id}`, { replace: true });
    } else if (room.type === 'trip') {
      navigate(`/?trips=open&tripId=${room.linked_id}`, { replace: true });
    } else if (room.type === 'plan') {
      let date = '';
      try { const ev = await base44.entities.CalendarEvent.get(room.linked_id); date = ev?.date || ''; } catch {}
      const sp = new URLSearchParams();
      sp.set('planId', room.linked_id);
      if (date) sp.set('calDate', date);
      navigate(`/calendar?${sp.toString()}`, { replace: true });
    }
  };

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

  // Mark chat notifications for this room addressed to me as read whenever the
  // room is opened or a new message arrives while it's open — so the bell
  // doesn't accumulate stale entries for the conversation I'm already in.
  useEffect(() => {
    if (!user?.id || !room.id) return;
    base44.entities.Notification
      .updateMany(
        { recipient_id: user.id, engagement_id: room.id, window_label: 'New Message', read: false },
        { $set: { read: true } }
      )
      .catch(() => {});
  }, [room.id, user?.id, messages.length]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setPendingFile(f);
    e.target.value = '';
  };

  const startEditTopic = () => {
    setTopicDraft(room.topic || '');
    setEditingTopic(true);
  };

  const saveTopic = async () => {
    const v = topicDraft.trim();
    setEditingTopic(false);
    if (v === (room.topic || '')) return;
    try {
      await base44.entities.ChatRoom.update(room.id, { topic: v });
    } catch {
      /* ignore */
    }
  };

  // Archiving is reversible and needs no confirmation — the parent handles the
  // optimistic update, authoritative refetch, and the Undo toast.
  const handleArchive = () => {
    onArchive?.(room);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !pendingFile) || sending || uploading) return;
    let attachment = null;
    if (pendingFile) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: pendingFile });
        attachment = { name: pendingFile.name, url: file_url };
      } catch {
        setUploading(false);
        setPendingFile(null);
        return;
      }
      setUploading(false);
    }
    const body = text || (attachment ? attachment.name : '');
    setInput('');
    setPendingFile(null);
    setSending(true);
    try {
      const msg = await base44.entities.ChatMessage.create({
        room_id: room.id,
        body,
        attachment,
        author_id: user.id,
        author_name: user.full_name || user.email,
        participant_ids: room.participant_ids,
      });
      await base44.entities.ChatRoom.update(room.id, {
        last_message: attachment && !text ? `📎 ${attachment.name}` : body.slice(0, 120),
        last_message_at: new Date().toISOString(),
        last_sender_name: user.full_name || user.email,
      });
      // Notify other participants: bell notification always, first-message
      // invitation email only. Runs server-side (notifyChatMessage) so email
      // failures are logged, not silently swallowed. Fire-and-forget so the
      // send isn't blocked.
      base44.functions
        .invoke('notifyChatMessage', { roomId: room.id, messageId: msg?.id })
        .catch((e) => console.warn('notifyChatMessage failed', e?.message || e));
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

  const q = (query || '').trim().toLowerCase();
  const visibleMessages = q
    ? messages.filter((m) => [m.body || '', m.attachment?.name || ''].join(' ').toLowerCase().includes(q))
    : messages;

  return (
    <div className="flex h-full flex-col">
      {backToItem && (
        <div className="flex items-center border-b border-border px-3 py-1.5">
          <button
            onClick={goBackToItem}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition hover:underline"
            title={`Back to ${itemLabel}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {itemLabel}
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{room.title}</p>
          {editingTopic ? (
            <Input
              autoFocus
              value={topicDraft}
              onChange={(e) => setTopicDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveTopic(); }
                else if (e.key === 'Escape') setEditingTopic(false);
              }}
              onBlur={saveTopic}
              placeholder="Topic (e.g. Q3 travel planning)"
              className="h-7 max-w-full text-xs"
            />
          ) : room.topic ? (
            <button
              onClick={startEditTopic}
              className="truncate text-left text-xs font-medium text-primary hover:underline"
              title="Edit topic"
            >
              {room.topic}
            </button>
          ) : (
            <button
              onClick={startEditTopic}
              className="text-left text-xs text-muted-foreground transition hover:text-foreground"
            >
              + Add topic
            </button>
          )}
        </div>
        {isParticipant && (
          isArchivedForMe ? (
            <>
              <button
                onClick={() => onUnarchive?.(room)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                title="Move to Conversations"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              {canDelete && (
                <button
                  onClick={() => onDelete?.(room)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  title="Delete permanently"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleArchive}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              title="Archive conversation for yourself"
            >
              <Archive className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2">
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
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
          title="Add participant"
        >
          <UserPlus className="h-3 w-3" /> Add
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading messages…</div>
        ) : visibleMessages.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {q ? 'No messages match your search.' : 'No messages yet. Say hello!'}
          </div>
        ) : (
          visibleMessages.map((m) => {
            if (m.is_system) {
              return (
                <div key={m.id} className="flex justify-center">
                  <p className="rounded-full bg-muted/60 px-3 py-1 text-center text-[11px] text-muted-foreground">
                    {m.body}
                  </p>
                </div>
              );
            }
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
                  {m.attachment && (
                    <a
                      href={m.attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      download={m.attachment.name}
                      className={`mb-1 flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs no-underline ${
                        mine ? 'border-primary-foreground/30 bg-primary-foreground/10' : 'border-border bg-background/50'
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{m.attachment.name}</span>
                      <Download className="ml-auto h-3.5 w-3.5 shrink-0" />
                    </a>
                  )}
                  {m.body && <p className="whitespace-pre-wrap break-words"><Highlight text={m.body} query={query} /></p>}
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

      <div className="border-t border-border px-3 py-2.5">
        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-secondary px-2 py-1.5 text-xs">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-secondary-foreground">{pendingFile.name}</span>
            <button
              onClick={() => setPendingFile(null)}
              className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition hover:text-foreground"
              aria-label="Remove attachment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={uploading ? 'Uploading…' : 'Type a message…'}
            className="flex-1"
            disabled={uploading}
          />
          <Button
            onClick={send}
            disabled={sending || uploading || (!input.trim() && !pendingFile)}
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AddParticipantDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        room={room}
        currentUser={user}
        onAdded={() => setAddOpen(false)}
      />
    </div>
  );
}