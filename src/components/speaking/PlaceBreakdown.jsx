import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/speaking';

export default function PlaceBreakdown({ items }) {
  const [expanded, setExpanded] = useState(false);

  const byPlace = items.reduce((acc, x) => {
    const key = x.place?.trim() || 'No place set';
    if (!acc[key]) acc[key] = [];
    acc[key].push(x);
    return acc;
  }, {});
  const sorted = Object.entries(byPlace).sort((a, b) => b[1].length - a[1].length);

  const previews = sorted.map(([place, placeItems]) => {
    const next = placeItems
      .filter(x => x.speaking_date && x.status !== 'Completed')
      .sort((a, b) => a.speaking_date.localeCompare(b.speaking_date))[0];
    return { place, next, total: placeItems.length };
  });

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Engagements by Place</h2>
      <div className="rounded-lg border border-[#D6DAE3] bg-white p-5 shadow-sm">
        {sorted.length === 0 ? (
          <p className="text-sm text-[#5A6781]">No engagements yet.</p>
        ) : (
          <ul className="space-y-3">
            {previews.map(({ place, next, total }) => (
              <li key={place}>
                <button
                  onClick={() => setExpanded(expanded === place ? false : place)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#D9A404]" />
                    <span className="text-sm font-medium text-[#1B2A4B]">{place}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs text-[#5A6781]">
                    {next ? <span>{formatDate(next.speaking_date)}</span> : <span>No upcoming</span>}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === place ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expanded === place && (
                  <ul className="mt-2 space-y-1.5 pl-6">
                    {byPlace[place]
                      .sort((a, b) => (a.speaking_date || '').localeCompare(b.speaking_date || ''))
                      .map(x => (
                        <li key={x.id} className="text-sm text-[#5A6781]">
                          {x.title} — {x.speaking_date ? formatDate(x.speaking_date) : 'Date not set'}
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}