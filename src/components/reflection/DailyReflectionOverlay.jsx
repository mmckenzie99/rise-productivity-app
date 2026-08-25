import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen } from 'lucide-react';
import DailyReflection from '@/components/speaking/DailyReflection';
import { formatDate } from '@/lib/speaking';

// Personal-use overlay: wraps the DailyReflection editor in a Dialog. In the
// no-account model reflections are shared across the workspace, so the old
// per-user oversight stamp is gone.
export default function DailyReflectionOverlay({ open, dateKey, engagements, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:max-h-[90dvh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <BookOpen className="h-5 w-5 text-primary" />
            Daily Reflection — {dateKey ? formatDate(dateKey) : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <DailyReflection dateKey={dateKey} engagements={engagements} />
        </div>
      </DialogContent>
    </Dialog>
  );
}