import { Check } from 'lucide-react';
import { formatTime, calEngagementTone, planCalTone } from '@/lib/speaking';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const keyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function WeekListSummary({ days, byDate, todayKey, onSelect, onEventSelect }) {
  return (
    <div className="mt-6 space-y-3">
      <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-[#5A6781]">
        This Week's Plans
      </h4>
      <div className="divide-y divide-[#EDEFF4] overflow-hidden rounded-lg border border-[#D6DAE3] bg-white">
        {days.map((d, i) => {
          const key = keyOf(d);
          const entries = byDate[key] || [];
          const isToday = key === todayKey;
          const dateLabel = `${DAY_LABELS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
          return (
            <div key={i} className={isToday ? 'bg-[#FBF0D0]/30' : ''}>
              <div className="flex items-baseline justify-between gap-2 px-3 py-2">
                <p className={`text-sm font-semibold ${isToday ? 'text-[#D9A404]' : 'text-[#1B2A4B]'}`}>
                  {dateLabel}
                </p>
                <span className="text-[11px] font-medium text-[#5A6781]">
                  {entries.length === 0 ? 'No plans' : `${entries.length} ${entries.length === 1 ? 'item' : 'items'}`}
                </span>
              </div>
              {entries.length === 0 ? (
                <div className="px-3 pb-2 text-xs text-[#5A6781]">Nothing scheduled.</div>
              ) : (
                <ul className="pb-2">
                  {entries.map((x) => {
                    const isEvent = x._kind === 'event';
                    const tone = isEvent ? planCalTone(x) : calEngagementTone;
                    const label = isEvent ? x.title : (x.place || x.title || 'Engagement');
                    const sub = isEvent ? (x.category) : formatTime(x.start_time);
                    return (
                      <li key={x.id}>
                        <button
                          onClick={() => (isEvent ? onEventSelect?.(x) : onSelect?.(x))}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-[#F7F8FA]"
                        >
                          <span className={`h-2 w-2 shrink-0 rounded-full ${tone.split(' ')[0]}`} />
                          <span className={`truncate text-xs font-medium ${isEvent && x.completed ? 'text-[#9CA3AF] line-through' : 'text-[#1B2A4B]'}`}>
                            {label}
                          </span>
                          {isEvent && x.completed && (
                            <Check className="h-3 w-3 shrink-0 text-[#D9A404]" strokeWidth={3} />
                          )}
                          {sub && (
                            <span className="ml-auto shrink-0 text-[11px] text-[#5A6781]">{sub}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}