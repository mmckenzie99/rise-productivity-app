import { useState } from 'react';
import { MessageSquare, Trash2, Send, Bell } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import ResponsiveSelect from './ResponsiveSelect';
import useComments from '@/hooks/useComments';

const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function CommentsSection({ engagementId, engagementTitle, engagementDate, admins, currentUserId }) {
  const { user } = useAuth();
  const { items, loading, add, remove } = useComments(engagementId);
  const [draft, setDraft] = useState('');
  const [notifyId, setNotifyId] = useState('none');
  const [saving, setSaving] = useState(false);

  const notifyOptions = (admins || []).filter((u) => u.id !== currentUserId);

  const submit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const author = user?.full_name || user?.email || 'Admin';
    const notifyAdmin = notifyOptions.find((u) => u.id === notifyId);
    try {
      await add(draft, author, notifyAdmin?.id || '', notifyAdmin?.full_name || notifyAdmin?.email || '');
      if (notifyAdmin?.email) {
        try {
          await base44.entities.Notification.create({
            engagement_id: engagementId,
            engagement_title: engagementTitle || 'Engagement',
            speaking_date: engagementDate || undefined,
            window_label: `Comment from ${author}`,
            email_sent: false,
            read: false,
          });
        } catch (e) {
          console.error('Failed to create comment notification', e);
        }
        try {
          await base44.integrations.Core.SendEmail({
            to: notifyAdmin.email,
            subject: `New comment on engagement: ${engagementTitle || 'Engagement'}`,
            body: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B"><h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B">${esc(author)} commented on an engagement</h2><p style="font-size:16px"><strong>${esc(engagementTitle || 'Engagement')}</strong></p><div style="border:1px solid #E3E6EC;border-radius:8px;padding:12px;background:#F7F8FA;font-size:14px;white-space:pre-wrap">${esc(draft)}</div><p style="font-size:13px;color:#5A6781;margin-top:12px">Open RISE to view and reply.</p></div>`,
          });
        } catch (e) {
          console.error('Failed to send comment email', e);
        }
      }
      setDraft('');
      setNotifyId('none');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="h-4 w-4" />Internal discussion ({items.length})
      </h3>
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading comments…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No comments yet. Start the discussion.</p>
        ) : (
          items.map((c) => (
            <div key={c.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{c.author_name || 'Anonymous'}</span>
                <button type="button" onClick={() => remove(c.id)} className="text-muted-foreground transition hover:text-[#B43A2E]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
              {c.notify_admin_name && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#D9A404]">
                  <Bell className="h-3 w-3" />Notified {c.notify_admin_name}
                </p>
              )}
            </div>
          ))
        )}
      </div>
      <div className="mt-3 space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an internal note for admins…"
          className="min-h-[72px] bg-card text-sm"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-[220px]">
            <ResponsiveSelect
              value={notifyId}
              onValueChange={setNotifyId}
              options={[{ value: 'none', label: 'No notification' }, ...notifyOptions.map((u) => ({ value: u.id, label: u.full_name || u.email }))]}
              triggerClassName="border-border text-xs"
            />
          </div>
          <Button type="button" onClick={submit} disabled={saving || !draft.trim()} className="bg-[#D9A404] hover:bg-[#B89003]">
            <Send className="mr-2 h-3.5 w-3.5" />{saving ? 'Posting…' : 'Post & Notify'}
          </Button>
        </div>
      </div>
    </section>
  );
}