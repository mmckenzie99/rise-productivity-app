import { Check, ChevronRight } from 'lucide-react';
import { formatTime, calEngagementTone, planCalTone } from '@/lib/speaking';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const keyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function WeeklyListSummary({ days, byDate, onSelect, onEventSelect, onGoToDate }) {
  const todayKey = keyOf(new Date());

  return (
    <div className="space-y-2.5">
      {days.map((d, i) => {
        const key = keyOf(d);
        const entries = byDate[key] || [];
        const isToday = key === todayKey;
        return (
          <div key={i} className="overflow-hidden rounded-lg border border-foreground/15 bg-card">
            <button
              onClick={() => onGoToDate?.(new Date(d))}
              className={`flex w-full items-center justify-between px-3 py-2.5 text-left ${isToday ? 'bg-primary/15' : 'bg-muted/40'}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{DAY_LABELS[d.getDay()]}</span>
                <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {MONTHS[d.getMonth()]} {d.getDate()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'item' : 'items'}` : '—'}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
            {entries.length > 0 ? (
              <div className="divide-y divide-foreground/10">
                {entries.map((x) => {
                  const isEvent = x._kind === 'event';
                  const tone = isEvent ? planCalTone(x) : calEngagementTone;
                  const label = isEvent ? x.title : (x.place || x.title || 'Engagement');
                  const sub = isEvent ? (x.category || 'Plan') : formatTime(x.start_time);
                  return (
                    <button
                      key={x.id}
                      onClick={() => (isEvent ? onEventSelect?.(x) : onSelect?.(x))}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left"
                    >
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${isEvent && x.completed ? 'bg-[#E5E7EB] text-[#9CA3AF] line-through' : tone}`}>
                        {isEvent ? (x.category || 'P').slice(0, 1) : 'E'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{label}</p>
                        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
                      </div>
                      {isEvent && x.completed && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-2 text-xs text-muted-foreground">No plans or engagements</p>
            )}
          </div>
        );
      })}
    </div>
  );
}