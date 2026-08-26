import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Bell, CalendarClock, AlignLeft } from 'lucide-react';
import { formatDate } from '@/lib/speaking';

const CATEGORY_TONE = {
  Personal: 'bg-[#FBF0D0]/70 text-[#8A6D0B] border-[#D9A404]/30',
  Work: 'bg-[#E2E8F0] text-[#1B2A4B] border-[#1B2A4B]/20',
};

export default function TaskQuickLook({ task, onClose }) {
  const navigate = useNavigate();
  if (!task) return null;
  const due = task.due_date ? formatDate(task.due_date.slice(0, 10)) : null;
  const reminder = task.reminder_at ? formatDate(task.reminder_at.slice(0, 10)) : null;

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-base font-semibold text-foreground">Task quick look</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className={`text-sm text-foreground ${task.is_done ? 'line-through opacity-70' : ''}`}>{task.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            {task.category && (
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${CATEGORY_TONE[task.category] || 'bg-muted text-muted-foreground border-border'}`}>
                {task.category}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Check className={`h-3 w-3 ${task.is_done ? 'text-primary' : 'text-muted-foreground'}`} />
              {task.is_done ? 'Completed' : 'Not completed'}
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            {due && (
              <p className="flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3" />
                Due {due}
              </p>
            )}
            {reminder && (
              <p className="flex items-center gap-1.5">
                <Bell className="h-3 w-3 text-primary" />
                Reminder {reminder}
              </p>
            )}
          </div>
          {task.notes && (
            <div className="border-t border-border pt-2">
              <h3 className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <AlignLeft className="h-3 w-3" />
                Notes
              </h3>
              <p className="text-sm text-foreground">{task.notes}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={() => { onClose(); navigate('/tasks'); }}>Open in Tasks</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}