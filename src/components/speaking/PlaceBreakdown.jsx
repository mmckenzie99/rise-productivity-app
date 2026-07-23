import { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

export default function PlaceBreakdown({ items, onSelect }) {
  const [cardOpen, setCardOpen] = useState(true);

  const sorted = [...items].sort((a, b) => {
    const pa = (a.place?.trim() || 'No place set').toLowerCase();
    const pb = (b.place?.trim() || 'No place set').toLowerCase();
    if (pa !== pb) return pa.localeCompare(pb);
    return (a.speaking_date || '').localeCompare(b.speaking_date || '');
  });

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Engagements by Place</h2>
      <div className="rounded-lg border border-[#D6DAE3] bg-white shadow-sm">
        <button
          onClick={() => setCardOpen(!cardOpen)}
          className="flex w-full items-center justify-between gap-2 p-5 text-left"
        >
          <span className="text-sm font-medium text-[#1B2A4B]">{sorted.length} engagement{sorted.length === 1 ? '' : 's'}</span>
          <ChevronDown className={`h-4 w-4 text-[#5A6781] transition-transform ${cardOpen ? 'rotate-180' : ''}`} />
        </button>
        {cardOpen && (
          <div className="border-t border-[#D6DAE3] px-5 pb-5 pt-3">
            {sorted.length === 0 ? (
              <p className="text-sm text-[#5A6781]">No engagements yet.</p>
            ) : (
              <ul className="space-y-2">
                {sorted.map(x => (
                  <li key={x.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#1B2A4B]">{x.place?.trim() || 'No place set'}</span>
                    <button
                      onClick={() => onSelect?.(x)}
                      className="text-[#D9A404] transition hover:text-[#B89003]"
                      title="View engagement"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}