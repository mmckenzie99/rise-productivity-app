import { useState } from 'react';
import { MessageSquare, Trash2, Send } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useComments from '@/hooks/useComments';

export default function CommentsSection({ engagementId, isAdmin }) {
  const { user } = useAuth();
  const { items, loading, add, remove } = useComments(engagementId);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await add(draft, user?.full_name);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-t border-[#D6DAE3] pt-4">
      <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]">
        <MessageSquare className="h-4 w-4" />Discussion ({items.length})
      </h3>
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-[#5A6781]">Loading comments…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-[#5A6781]">No comments yet. Start the discussion.</p>
        ) : (
          items.map(c => (
            <div key={c.id} className="rounded-md border border-[#D6DAE3] bg-[#F7F8FA] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1B2A4B]">{c.author_name || 'Anonymous'}</span>
                {isAdmin && (
                  <button onClick={() => remove(c.id)} className="text-[#5A6781] transition hover:text-[#B43A2E]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#1B2A4B]">{c.body}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-3 space-y-2">
        <Textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add a comment about presentation notes or travel updates…"
          className="min-h-[72px] bg-white text-sm"
        />
        <div className="flex justify-end">
          <Button onClick={submit} disabled={saving || !draft.trim()} className="bg-[#D9A404] hover:bg-[#B89003]">
            <Send className="mr-2 h-3.5 w-3.5" />{saving ? 'Posting…' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </section>
  );
}