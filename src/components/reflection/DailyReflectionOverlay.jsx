import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Eye } from 'lucide-react';
import DailyReflection from '@/components/speaking/DailyReflection';
import { formatDate } from '@/lib/speaking';
import { format, parseISO } from 'date-fns';

// Personal-use overlay: wraps the existing DailyReflection editor in a Dialog
// and surfaces the passive "last reviewed by" transparency note beneath it,
// so the entry owner sees — in context — when the Owner last opened this
// reflection for oversight.
export default function DailyReflectionOverlay({ open, dateKey, engagements, onClose }) {
  const { user } = useAuth();
  const [stamp, setStamp] = useState(null);

  useEffect(() => {
    if (!open || !dateKey || !user?.id) return;
    let active = true;
    base44.entities.DailyReflection
      .filter({ date: dateKey, created_by_id: user.id })
      .then((res) => {
        if (!active) return;
        const rec = res && res[0];
        setStamp(rec?.last_viewed_at ? { name: rec.last_viewed_by_admin_name, at: rec.last_viewed_at } : null);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [open, dateKey, user?.id]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <BookOpen className="h-5 w-5 text-primary" />
            Daily Reflection — {dateKey ? formatDate(dateKey) : ''}
          </DialogTitle>
        </DialogHeader>
        <DailyReflection dateKey={dateKey} engagements={engagements} />
        {stamp && (
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>Last reviewed by {stamp.name} on {format(parseISO(stamp.at), 'MMM d, yyyy h:mm a')}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}