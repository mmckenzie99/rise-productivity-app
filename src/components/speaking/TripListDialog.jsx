import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Plane, Building2, CalendarDays } from 'lucide-react';
import { formatCurrency, formatPlaces } from '@/lib/trips';

export default function TripListDialog({ open, trips, loading, isAdmin, onClose, onAdd, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:max-h-[90dvh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
          <DialogTitle className="font-display text-xl">Trip Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {isAdmin && (
          <Button onClick={onAdd} className="bg-[#D9A404] hover:bg-[#B89003]">
            <Plus className="mr-2 h-4 w-4" />New Trip
          </Button>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-[#5A6781]">Loading trips…</div>
        ) : trips.length ? (
          <div className="space-y-2">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="flex w-full items-center gap-3 rounded-lg border border-[#D6DAE3] bg-white p-3 text-left transition hover:border-[#D9A404]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F7F8FA]">
                  <Plane className="h-4 w-4 text-[#1B2A4B]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1B2A4B]">{formatPlaces(t)}</p>
                  <div className="flex flex-wrap gap-x-3 text-xs text-[#5A6781]">
                    <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{t.department}</span>
                    {t.leave_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{t.leave_date}{t.return_date ? ` → ${t.return_date}` : ''}</span>}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-[#1B2A4B]">{formatCurrency(t.total_cost)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#D9A404] bg-white/60 py-10 text-center">
            <h3 className="font-display text-lg font-semibold">No trips yet</h3>
            <p className="mt-1 text-sm text-[#5A6781]">{isAdmin ? 'Create a trip and link it to a place.' : 'No trip details have been added.'}</p>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}