import { useState } from 'react';
import { MapPin, ChevronDown, CalendarDays } from 'lucide-react';
import EngagementCard from './EngagementCard';
import CardWrapper from './CardWrapper';
import { daysUntil, formatDate } from '@/lib/speaking';

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

export default function LocationGroup({ place, items, onClick, onDuplicate, isAdmin, tripIds, onLocate }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length <= 1) {
    const item = items[0];
    if (!item) return null;
    return <EngagementCard key={item.id} item={item} onClick={onClick} onDuplicate={onDuplicate} isAdmin={isAdmin} hasTrip={tripIds?.has(item.id)} onLocate={onLocate} />;
  }

  const upcoming = items
    .filter(x => x.speaking_date)
    .map(x => ({ date: x.speaking_date, days: daysUntil(x.speaking_date) }))
    .sort((a, b) => a.days - b.days);
  const next = upcoming.find(x => x.days >= 0);
  const daysLabel = next
    ? next.days === 0 ? 'Today' : next.days === 1 ? 'Tomorrow' : `in ${next.days} days`
    : null;

  return (
    <CardWrapper className="sm:col-span-2 lg:col-span-3 p-4">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between gap-2 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <MapPin className="h-4 w-4 text-[#D9A404]" />
          <span className="text-sm font-medium text-[#1B2A4B]">{place || 'No place set'}</span>
          <span className="rounded-full border border-[#D6DAE3] px-2 py-0.5 font-mono text-[10px] text-[#5A6781]">
            {items.length} engagement{items.length === 1 ? '' : 's'}
          </span>
          {daysLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D9A404] bg-[#D9A404]/10 px-2 py-0.5 font-mono text-[10px] text-[#1B2A4B]">
              <CalendarDays className="h-3 w-3" />{daysLabel}
            </span>
          )}
          {next && <span className="font-mono text-[10px] text-[#5A6781]">{formatDate(next.date)}</span>}
        </div>
        <ChevronDown className={`h-4 w-4 text-[#5A6781] transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className={`mt-4 ${GRID}`}>
          {items.map(x => (
            <EngagementCard key={x.id} item={x} onClick={onClick} onDuplicate={onDuplicate} isAdmin={isAdmin} hasTrip={tripIds?.has(x.id)} onLocate={onLocate} />
          ))}
        </div>
      )}
    </CardWrapper>
  );
}