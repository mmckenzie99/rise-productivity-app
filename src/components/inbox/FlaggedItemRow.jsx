import { X } from 'lucide-react';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// A single flagged follow-up row in the Inbox. Shows only the item's date
// (falling back to its title when no date is stored). The body navigates to
// the source record; the X button unflags it (removes it from the Inbox)
// without deleting the underlying record.
export default function FlaggedItemRow({ icon, item, onNavigate, onUntag }) {
  const dateLabel = formatDate(item.message_date) || item.source_title || 'Item';
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 transition hover:border-primary/50">
      <button type="button" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {icon}
        <span className="truncate text-sm font-medium">{dateLabel}</span>
      </button>
      <button
        type="button"
        onClick={onUntag}
        aria-label="Remove from Inbox"
        title="Remove from Inbox"
        className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}