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
import { Bell, Trash2, ListTodo, Presentation, Plane } from 'lucide-react';
import { formatDateTime, isDue } from '@/lib/inbox';

const ACT =
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border bg-card text-foreground transition hover:border-primary hover:text-primary';

const ENTITY_BADGE = {
  Task: 'border-primary/40 text-primary',
  Engagement: 'border-chart-3/50 text-chart-3',
  Trip: 'border-chart-4/50 text-chart-4',
  None: 'border-border text-muted-foreground',
};

function EntityBadge({ type }) {
  const cls = ENTITY_BADGE[type] || ENTITY_BADGE.None;
  const label = type === 'None' || !type ? 'Uncategorized' : type;
  return (
    <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', cls)}>
      {label}
    </span>
  );
}

export default function InboxItemCard({ item, onConvert, onDelete, canManageTrips }) {
  const due = isDue(item);
  return (
    <div
      className={`rounded-lg border p-4 transition ${
        due ? 'border-[#D9A404] bg-[#D9A404]/5' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-foreground">
          {item.message_text}
        </p>
        {due ? (
          <span className="shrink-0 rounded-full bg-[#D9A404] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Due
          </span>
        ) : (
          <EntityBadge type={item.entity_type} />
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {item.sender_name && <span>From: {item.sender_name}</span>}
        {item.sender_number && <span>{item.sender_number}</span>}
        {item.message_date && <span>Received: {formatDateTime(item.message_date)}</span>}
        {item.reminder_at && (
          <span className="inline-flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {formatDateTime(item.reminder_at)}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={ACT} onClick={() => onConvert('task', item)}>
          <ListTodo className="h-3.5 w-3.5" />
          Task
        </button>
        {canManageTrips && (
          <>
            <button type="button" className={ACT} onClick={() => onConvert('engagement', item)}>
              <Presentation className="h-3.5 w-3.5" />
              Engagement
            </button>
            <button type="button" className={ACT} onClick={() => onConvert('trip', item)}>
              <Plane className="h-3.5 w-3.5" />
              Trip
            </button>
          </>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>
                This captured message will be permanently removed. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {item.message_text ? (
              <p className="line-clamp-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {item.message_text}
              </p>
            ) : null}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: 'destructive' }))}
                onClick={() => onDelete(item)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}