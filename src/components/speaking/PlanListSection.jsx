import { formatDate, formatTime } from '@/lib/speaking';

export default function PlanListSection({ title, icon: Icon, tone, items, emptyText }) {
  const sorted = [...items].sort((a, b) => (b.updated_date || b.date || '').localeCompare(a.updated_date || a.date || ''));
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{sorted.length}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="py-5 text-center text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.slice(0, 8).map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2">
              <span className="truncate text-sm font-medium">{p.title}</span>
              {p.category && (
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {p.category}
                </span>
              )}
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {formatDate(p.date)}{p.start_time ? ` · ${formatTime(p.start_time)}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}