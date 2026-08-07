import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Loader2, BookOpen } from 'lucide-react';
import RichTextDisplay from '@/components/speaking/RichTextDisplay';
import { formatDate } from '@/lib/speaking';
import { format, parseISO } from 'date-fns';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Owner-only oversight dialog: loads a specific user's reflection for a chosen
// date (read-only display), and stamps the "last reviewed" audit trail by
// invoking the recordReflectionView service-role function on open. Non-Owner
// admins are blocked by the function itself (403).
export default function ReflectionOversightDialog({ open, targetUser, onClose }) {
  const [date, setDate] = useState(todayStr());
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    if (!open || !targetUser?.id) return;
    let active = true;
    setLoading(true);
    setRecord(null);
    setStamped(false);
    base44.entities.DailyReflection
      .filter({ date, created_by_id: targetUser.id })
      .then((res) => { if (active) setRecord((res && res[0]) || null); })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, targetUser?.id, date]);

  // Stamp once a record is loaded — server-verified, never client-supplied.
  useEffect(() => {
    if (!open || !record?.id || stamped) return;
    setStamped(true);
    base44.functions
      .invoke('recordReflectionView', { reflectionId: record.id })
      .then((res) => { if (res?.data?.reflection) setRecord(res.data.reflection); })
      .catch(() => {});
  }, [open, record?.id, stamped]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:max-h-[90dvh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Eye className="h-5 w-5 text-primary" />
            Reflection oversight — {targetUser?.full_name || targetUser?.email}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[200px]" />
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !record ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No reflection saved for {formatDate(date)}.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meditation</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{record.meditation || <span className="text-muted-foreground">—</span>}</p>
              {record.meditation_reference && <p className="mt-1 text-xs text-muted-foreground">{record.meditation_reference}</p>}
            </div>
            {record.goals && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goals</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{record.goals}</p>
              </div>
            )}
            {record.note && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note</p>
                <div className="mt-1 rounded-md border border-border p-3 text-sm">
                  <RichTextDisplay html={record.note} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span>
                {record.last_viewed_at
                  ? `Last reviewed by ${record.last_viewed_by_admin_name} on ${format(parseISO(record.last_viewed_at), 'MMM d, yyyy h:mm a')}`
                  : 'Not yet reviewed for oversight.'}
              </span>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}