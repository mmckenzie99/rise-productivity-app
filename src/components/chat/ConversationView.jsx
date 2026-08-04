import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Paperclip, FileText, Download, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Highlight from '@/components/chat/Highlight';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';

export default function ConversationView({ room, user, onBack, query }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingTopic, setEditingTopic] = useState(false);
  const [topicDraft, setTopicDraft] = useState('');
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const usersRef = useRef(null);

  // "Way back": for a room linked to an engagement/trip/plan, jump back to it.
  const itemLabel = room.type === 'engagement' ? 'Engagement'
    : room.type === 'trip' ? 'Trip'
    : room.type === 'plan' ? 'Plan' : '';
  const backToItem = room.linked_id && itemLabel
    ? room.type === 'engagement' ? `/?engagementId=${room.linked_id}`
      : room.type === 'trip' ? `/?tripId=${room.linked_id}`
      : `/?planId=${room.linked_id}`
    : null;

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

    // Cache users so we can email other participants when a new message starts
    // a conversation.
    base44.entities.User
      .list()
      .then((list) => { if (mounted) usersRef.current = list || []; })
      .catch(() => {});

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

  const canDelete = user.role === 'admin' || room.created_by_id === user.id;

  const handleDelete = async () => {
    const ok = window.confirm('Delete this conversation and all its messages? This cannot be undone.');
    if (!ok) return;
    try {
      await base44.entities.ChatMessage.deleteMany({ room_id: room.id });
    } catch {
      /* ignore */
    }
    try {
      await base44.entities.ChatRoom.delete(room.id);
    } catch {
      /* ignore */
    }
    onBack();
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
      await base44.entities.ChatMessage.create({
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
      // When this is the first message in the conversation, immediately email
      // the other participants (all registered app users) so they know a new
      // message is waiting. Fire-and-forget.
      if (messages.length === 0) {
        const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const preview = attachment && !text ? `📎 ${attachment.name}` : body.slice(0, 200);
        const sender = esc(user.full_name || user.email);
        const subject = attachment && !text ? `${user.full_name || user.email} shared a file with you` : `${user.full_name || user.email} messaged you`;
        (room.participant_ids || []).filter((id) => id !== user.id).forEach((pid) => {
          const u = (usersRef.current || []).find((x) => x.id === pid);
          if (!u?.email) return;
          base44.integrations.Core.SendEmail({
            to: u.email,
            subject,
            body: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B"><h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B">New message</h2><p style="font-size:16px"><strong>${sender}</strong> started a conversation with you:</p><p style="font-size:15px;padding:10px 14px;background:#F0F2F6;border-radius:8px">${esc(preview)}</p><p style="font-size:13px;color:#5A6781">Open RISE and tap Chat to reply.</p></div>`,
          }).catch(() => {});
        });
      }
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
            onClick={() => navigate(backToItem, { replace: true })}
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
        {canDelete && (
          <button
            onClick={handleDelete}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
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
        ) : visibleMessages.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {q ? 'No messages match your search.' : 'No messages yet. Say hello!'}
          </div>
        ) : (
          visibleMessages.map((m) => {
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
    </div>
  );
}