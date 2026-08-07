import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import EngagementCard from './EngagementCard';
import CardWrapper from './CardWrapper';
import CountdownBadge from './CountdownBadge';
import { daysUntil } from '@/lib/speaking';

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

export default function LocationGroup({ place, items, onClick, onDuplicate, isAdmin, tripPlaces, onLocate }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length <= 1) {
    const item = items[0];
    if (!item) return null;
    return (
      <div>
        <EngagementCard key={item.id} item={item} onClick={onClick} onDuplicate={onDuplicate} isAdmin={isAdmin} hasTrip={tripPlaces?.has((item.place||'').trim().toLowerCase())} onLocate={onLocate} />
      </div>
    );
  }

  const upcoming = items
    .filter(x => x.speaking_date)
    .map(x => ({ date: x.speaking_date, days: daysUntil(x.speaking_date) }))
    .sort((a, b) => a.days - b.days);
  const next = upcoming.find(x => x.days >= 0);

  return (
    <CardWrapper className="sm:col-span-2 lg:col-span-3 p-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setExpanded(!expanded)} className="flex flex-1 items-center justify-between gap-2 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <img src="https://media.base44.com/images/public/6a60116b6ae7a4bd8b520b63/9f7bd64d0_Icon.png" alt="" className="h-5 w-5" />
            <span className="text-sm font-medium text-foreground">{place || 'No place set'}</span>
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {items.length} engagement{items.length === 1 ? '' : 's'}
            </span>
            {next && <CountdownBadge date={next.date} showDate />}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className={`mt-4 ${GRID}`}>
          {[...items].sort((a, b) => (a.speaking_date || '9999-12-31').localeCompare(b.speaking_date || '9999-12-31')).map(x => (
            <EngagementCard key={x.id} item={x} onClick={onClick} onDuplicate={onDuplicate} isAdmin={isAdmin} hasTrip={tripPlaces?.has((x.place||'').trim().toLowerCase())} onLocate={onLocate} />
          ))}
        </div>
      )}
    </CardWrapper>
  );
}