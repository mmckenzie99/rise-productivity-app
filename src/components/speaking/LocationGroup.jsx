import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import EngagementCard from './EngagementCard';

export default function LocationGroup({ address, items, onClick, onDuplicate, isAdmin, tripIds, onLocate }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length <= 1) {
    const item = items[0];
    if (!item) return null;
    return <EngagementCard key={item.id} item={item} onClick={onClick} onDuplicate={onDuplicate} isAdmin={isAdmin} hasTrip={tripIds?.has(item.id)} onLocate={onLocate} />;
  }

  return (
    <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-[#D6DAE3] bg-[#F7F8FA] p-3">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between gap-2 text-left">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#D9A404]" />
          <span className="text-sm font-medium text-[#1B2A4B]">{address || 'Same location'}</span>
          <span className="rounded-full border border-[#D6DAE3] bg-white px-2 py-0.5 font-mono text-[10px] text-[#5A6781]">
            {items.length} engagement{items.length === 1 ? '' : 's'}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-[#5A6781] transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(x => (
            <EngagementCard key={x.id} item={x} onClick={onClick} onDuplicate={onDuplicate} isAdmin={isAdmin} hasTrip={tripIds?.has(x.id)} onLocate={onLocate} />
          ))}
        </div>
      )}
    </div>
  );
}