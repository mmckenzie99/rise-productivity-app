import { CalendarDays } from 'lucide-react';
import { formatDate, formatTime, statusTone } from '@/lib/speaking';

export default function MonthBreakdown({ items }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const monthEvents = items
    .filter(x => {
      if (!x.speaking_date || x.status === 'Completed') return false;
      const d = new Date(`${x.speaking_date}T00:00:00`);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => a.speaking_date.localeCompare(b.speaking_date));

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Upcoming in {monthName}</h2>
      <div className="rounded-lg border border-[#D6DAE3] bg-white p-5 shadow-sm">
        {monthEvents.length === 0 ? (
          <p className="text-sm text-[#5A6781]">No engagements scheduled this month.</p>
        ) : (
          <ul className="space-y-3">
            {monthEvents.map(x => (
              <li key={x.id} className="flex items-center justify-between gap-2 border-b border-[#D6DAE3] pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#D9A404]" />
                  <div>
                    <p className="text-sm font-medium text-[#1B2A4B]">{x.title}</p>
                    <p className="text-xs text-[#5A6781]">{x.place || 'No place set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs text-[#5A6781]">
                  <span>{formatDate(x.speaking_date)}{x.start_time && ` · ${formatTime(x.start_time)}`}</span>
                  <span className={`rounded-full px-2 py-0.5 ${statusTone[x.status]}`}>{x.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}