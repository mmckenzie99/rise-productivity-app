import { useState, useMemo } from 'react';
import { Search, Archive as ArchiveIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import EngagementCard from './EngagementCard';

export default function ArchiveDialog({ open, onClose, items, onSelect, isAdmin, tripPlaces, onLocate, onDuplicate }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => items.filter(x => `${x.title} ${x.speaker_name} ${x.address}`.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl"><ArchiveIcon className="h-5 w-5 text-[#D9A404]" />Archive</DialogTitle>
        </DialogHeader>
        <div className="relative sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5A6781]" />
          <Input className="bg-white pl-9 text-sm h-9 border-[#D6DAE3]" placeholder="Search archived engagements…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(x => (
              <EngagementCard key={x.id} item={x} onClick={onSelect} onDuplicate={onDuplicate} isAdmin={isAdmin} hasTrip={tripPlaces?.has((x.place||'').trim().toLowerCase())} onLocate={onLocate} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#D6DAE3] py-14 text-center">
            <h2 className="font-display text-xl font-semibold">{items.length ? 'Nothing matches' : 'Archive is empty'}</h2>
            <p className="mt-2 text-sm text-[#5A6781]">{items.length ? 'Try a different search.' : 'Completed engagements will appear here.'}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}