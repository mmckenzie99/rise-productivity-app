import { MapPin } from 'lucide-react';
import { formatDate } from '@/lib/speaking';

export default function PlaceBreakdown({ items }) {
  const byPlace = items.reduce((acc, x) => {
    const key = x.place?.trim() || 'No place set';
    if (!acc[key]) acc[key] = { count: 0, next: null };
    acc[key].count++;
    if (x.speaking_date && x.status !== 'Completed') {
      if (!acc[key].next || x.speaking_date < acc[key].next) acc[key].next = x.speaking_date;
    }
    return acc;
  }, {});
  const sorted = Object.entries(byPlace).sort((a, b) => b[1].count - a[1].count);

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Engagements by Place</h2>
      <div className="rounded-lg border border-[#D6DAE3] bg-white p-5 shadow-sm">
        {sorted.length === 0 ? (
          <p className="text-sm text-[#5A6781]">No engagements yet.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map(([place, { count, next }]) => (
              <li key={place} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#D9A404]" />
                  <span className="text-sm font-medium text-[#1B2A4B]">{place}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs text-[#5A6781]">
                  {next && <span>Next: {formatDate(next)}</span>}
                  <span className="rounded-full border border-[#D6DAE3] px-2 py-0.5">{count} engagement{count === 1 ? '' : 's'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}