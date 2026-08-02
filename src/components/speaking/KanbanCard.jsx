import { CalendarDays, MapPin } from 'lucide-react';
import { formatDate, formatTime, statusTone } from '@/lib/speaking';

export default function KanbanCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <p className="font-display text-base font-semibold leading-tight">{item.place}</p>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        {item.address && (
          <p className="flex gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />{item.address}</p>
        )}
        <p className="flex gap-1.5"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{formatDate(item.speaking_date)}{item.start_time && ` · ${formatTime(item.start_time)}`}</p>
      </div>
      <span className={`mt-3 inline-block rounded-full px-2 py-0.5 font-mono text-[11px] md:text-[10px] uppercase ${statusTone[item.progress] || 'bg-muted text-muted-foreground'}`}>
        {item.progress}
      </span>
    </button>
  );
}