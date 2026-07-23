import { CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/speaking';

export default function MonthBreakdown({ items }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const monthEvents = items
    .filter(x => {
      const date = x.speaking_date || x.deploy_date;
      if (!date || x.status === 'Completed') return false;
      const d = new Date(`${date}T00:00:00`);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => (a.speaking_date || a.deploy_date).localeCompare(b.speaking_date || b.deploy_date));

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Upcoming Engagements</h2>
      <div className="rounded-lg border border-[#D6DAE3] bg-white p-5 shadow-sm">
        {monthEvents.length === 0 ? (
          <p className="text-sm text-[#5A6781]">No engagements scheduled this month.</p>
        ) : (
          <ul className="space-y-3">
            {monthEvents.map(x => (
              <li key={x.id} className="flex items-center justify-between gap-2 border-b border-[#D6DAE3] pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#D9A404]" />
                  <p className="text-sm font-medium text-[#1B2A4B]">{x.title}</p>
                </div>
                <span className="font-mono text-xs text-[#5A6781]">{formatDate(x.speaking_date || x.deploy_date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}