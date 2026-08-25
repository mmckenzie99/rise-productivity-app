import { Fragment } from 'react';
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
import { Pencil, Trash2, CalendarPlus, CalendarDays, Bell, Repeat } from 'lucide-react';
import { formatDateTime } from '@/lib/inbox';
import ImportantFlagButton from '@/components/speaking/ImportantFlagButton';
import { useImportantFlags } from '@/lib/ImportantFlagsProvider';

const NOTE_URL_RE = /((?:https?:\/\/|msteams:\/\/|www\.)[^\s<>]+)/gi;

// Long links (Teams message links especially) are shown as a short label
// so list rows stay tidy; the full URL is kept in the title/href.
const shortLabel = (url) => {
  if (url.length <= 48) return url;
  try {
    const u = new URL(/^www\./i.test(url) ? `https://${url}` : url);
    return `${u.hostname}/…`;
  } catch {
    return `${url.slice(0, 45)}…`;
  }
};

// Renders plain-text notes, turning any URLs (e.g. Microsoft Teams message links)
// into clickable links that open in a new tab.
const renderNotes = (text) =>
  String(text)
    .split(NOTE_URL_RE)
    .map((part, i) => {
      if (!part) return null;
      if (i % 2 === 0) return part;
      const trail = (part.match(/[.,;:!?)\]]+$/) || [''])[0];
      const url = trail ? part.slice(0, part.length - trail.length) : part;
      const href = /^www\./i.test(url) ? `https://${url}` : url;
      return (
        <Fragment key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={url}
            onClick={(e) => e.stopPropagation()}
            className="break-all font-medium text-primary underline underline-offset-2 hover:opacity-80"
          >
            {shortLabel(url)}
          </a>
          {trail}
        </Fragment>
      );
    });

const isOverdue = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
};

export default function TaskItem({ task, onToggle, onEdit, onSchedule, onDelete, compact, linkedPlanTitle }) {
  const overdue = !task.is_done && isOverdue(task.due_date);
  const { flaggedKeys, toggle } = useImportantFlags();
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
            Due {formatDateTime(task.due_date)}
          </p>
        )}
        {task.reminder_at && !task.is_done && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Bell className="h-3 w-3" />
            Remind {formatDateTime(task.reminder_at)}
          </p>
        )}
        {task.is_recurring && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary">
            <Repeat className="h-3 w-3" />
            Recurring
          </p>
        )}
        {task.linked_plan_id && linkedPlanTitle && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            Linked to: {linkedPlanTitle}
          </p>
        )}
        {!compact && task.notes && (
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-xs text-muted-foreground">{renderNotes(task.notes)}</p>
        )}
      </div>

      <ImportantFlagButton flagged={flaggedKeys.has(`Task:${task.id}`)} onToggle={() => toggle('Task', task.id, task.title)} />

      {!compact && onSchedule && !task.is_done && !task.converted_to_plan_id && (
        <button
          type="button"
          onClick={() => onSchedule(task)}
          aria-label="Schedule as plan"
          title="Schedule as plan"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-primary"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </button>
      )}

      {!compact && onEdit && (
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground"
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
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded text-destructive transition hover:bg-destructive/10"
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
                onClick={() => onDelete(task.id)}
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