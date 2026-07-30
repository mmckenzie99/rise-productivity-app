import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateICSBatch, downloadICS } from '@/lib/icsExport';
import CalendarView from './CalendarView';
import { Download } from 'lucide-react';
import useHistoryModal from '@/hooks/useHistoryModal';

export default function CalendarDialog({ open, onClose, items, events, onSelect, onEventSelect, onAddSlot }) {
  const requestClose = useHistoryModal(open, onClose);
  return (
    <Dialog open={open} onOpenChange={v => !v && requestClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Calendar</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="flex justify-end">
            <button
              onClick={() => downloadICS(generateICSBatch(items), 'all-engagements.ics')}
              disabled={!items.length}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D6DAE3] bg-white px-3 py-1.5 text-xs font-medium text-[#1B2A4B] transition hover:border-[#D9A404] hover:text-[#D9A404] disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />Export all (.ics)
            </button>
          </div>
          <CalendarView items={items} events={events} onSelect={onSelect} onEventSelect={onEventSelect} onAddSlot={onAddSlot} />
        </div>
      </DialogContent>
    </Dialog>
  );
}