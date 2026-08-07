import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateICSBatch, downloadICS } from '@/lib/icsExport';
import CalendarView from './CalendarView';
import { Download } from 'lucide-react';

export default function CalendarDialog({ open, onClose, items, events, onSelect, onEventSelect, onAddSlot, focusDate }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:max-h-[90dvh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
          <DialogTitle className="font-display text-2xl">Calendar</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-5">
          <div className="flex justify-end">
            <button
              onClick={() => downloadICS(generateICSBatch(items), 'all-engagements.ics')}
              disabled={!items.length}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D6DAE3] bg-white px-3 py-1.5 text-xs font-medium text-[#1B2A4B] transition hover:border-[#D9A404] hover:text-[#D9A404] disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />Export all (.ics)
            </button>
          </div>
          <CalendarView items={items} events={events} onSelect={onSelect} onEventSelect={onEventSelect} onAddSlot={onAddSlot} focusDate={focusDate} />
        </div>
      </DialogContent>
    </Dialog>
  );
}