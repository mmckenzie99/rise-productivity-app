import { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

const COMPASS_ICON = 'https://media.base44.com/images/public/6a60116b6ae7a4bd8b520b63/9f7bd64d0_Icon.png';

export default function PlaceBreakdown({ items, onSelect }) {
  const [cardOpen, setCardOpen] = useState(true);
  const [openPlace, setOpenPlace] = useState(null);

  const byPlace = items.reduce((acc, x) => {
    const key = x.place?.trim() || 'No place set';
    if (!acc[key]) acc[key] = [];
    acc[key].push(x);
    return acc;
  }, {});
  const sorted = Object.entries(byPlace).sort((a, b) => b[1].length - a[1].length);

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold">Engagements by Place</h2>
      <div className="rounded-lg border border-[#D6DAE3] bg-white shadow-sm">
        <button
          onClick={() => setCardOpen(!cardOpen)}
          className="flex w-full items-center justify-between gap-2 p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <Image src={COMPASS_ICON} alt="Place" fittingType="fit" className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium text-[#1B2A4B]">{sorted.length} place{sorted.length === 1 ? '' : 's'}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-[#5A6781] transition-transform ${cardOpen ? 'rotate-180' : ''}`} />
        </button>
        {cardOpen && (
          <div className="border-t border-[#D6DAE3] px-5 pb-5 pt-3">
            {sorted.length === 0 ? (
              <p className="text-sm text-[#5A6781]">No engagements yet.</p>
            ) : (
              <ul className="space-y-2">
                {sorted.map(([place, placeItems]) => {
                  const isOpen = openPlace === place;
                  const multiple = placeItems.length > 1;
                  return (
                    <li key={place}>
                      {multiple ? (
                        <button
                          onClick={() => setOpenPlace(isOpen ? null : place)}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Image src={COMPASS_ICON} alt="Place" fittingType="fit" className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium text-[#1B2A4B]">{place}</span>
                          </div>
                          <ChevronDown className={`h-3.5 w-3.5 text-[#5A6781] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelect?.(placeItems[0])}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Image src={COMPASS_ICON} alt="Place" fittingType="fit" className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium text-[#1B2A4B]">{place}</span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-[#D9A404]" />
                        </button>
                      )}
                      {multiple && isOpen && (
                        <ul className="mt-1.5 space-y-1 pl-6">
                          {placeItems.map(x => (
                            <li key={x.id}>
                              <button
                                onClick={() => onSelect?.(x)}
                                className="flex w-full items-center justify-between gap-2 text-left py-0.5"
                              >
                                <span className="text-sm text-[#5A6781]">{x.title || x.place}</span>
                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#D9A404]" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}