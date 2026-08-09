import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/inbox';

const isOverdue = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
};

export default function TaskItem({ task, onToggle, onEdit, onDelete, compact }) {
  const overdue = !task.is_done && isOverdue(task.due_date);
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border p-2.5 transition',
        task.is_done
          ? 'border-border bg-muted/30 opacity-60'
          : overdue
            ? 'border-primary/50 bg-primary/5'
            : 'border-border bg-card'
      )}
    >
      <Checkbox checked={!!task.is_done} onCheckedChange={() => onToggle(task)} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className={cn('break-words text-sm', task.is_done && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        {task.due_date && (
          <p className={cn('mt-0.5 text-xs', overdue ? 'font-medium text-primary' : 'text-muted-foreground')}>
            {formatDateTime(task.due_date)}
          </p>
        )}
        {!compact && task.notes && (
          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{task.notes}</p>
        )}
      </div>

      {!compact && onEdit && (
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="shrink-0 rounded p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {!compact && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              aria-label="Delete task"
              className="shrink-0 rounded p-1.5 text-destructive transition hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this task?</AlertDialogTitle>
              <AlertDialogDescription>
                “{task.title}” will be permanently removed. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: 'destructive' }))}
                onClick={() => onDelete(task)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}