import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, MapPin, Clock3, Tags, AlignLeft } from 'lucide-react';
import { formatDate, formatTime, TIMEZONES, asArray } from '@/lib/speaking';

export default function EngagementQuickLook({ item, onClose }) {
  if (!item) return null;
  const dateForDisplay = item.speaking_date || item.deploy_date;
  const isRange = item.end_date && item.end_date !== dateForDisplay;
  return (
    <Dialog open={!!item} onOpenChange={v => !v && onClose()}>
      <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-hidden gap-0 p-0 bg-white translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:max-h-[90dvh] sm:max-w-xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-[#D6DAE3] px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3 text-center items-center">
          <DialogTitle className="font-display text-2xl">{item.place || 'Place not set'}</DialogTitle>
          {item.title && <p className="text-sm font-medium text-[#5A6781]">{item.title}</p>}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {asArray(item.presentation_type).length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {asArray(item.presentation_type).map(t => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full border border-[#D6DAE3] px-3 py-1 text-xs text-[#1B2A4B]">
                <Tags className="h-3 w-3 text-[#D9A404]" />
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-2 text-sm">
          {dateForDisplay && (
            <p className="flex gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#5A6781]" />
              {isRange ? `${formatDate(dateForDisplay)} – ${formatDate(item.end_date)}` : formatDate(dateForDisplay)}
            </p>
          )}
          {item.start_time && (
            <p className="flex gap-2">
              <Clock3 className="h-4 w-4 shrink-0 text-[#5A6781]" />
              {formatTime(item.start_time)}{item.end_time ? ` – ${formatTime(item.end_time)}` : ''}
              {item.timezone && ` (${TIMEZONES.find(z => z.value === item.timezone)?.label || item.timezone})`}
            </p>
          )}
          {item.address && (
            <p className="flex gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#5A6781]" />
              {item.address}
            </p>
          )}
        </div>

        {item.description && (
          <div className="border-t border-[#D6DAE3] pt-3">
            <h3 className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]">
              <AlignLeft className="h-3 w-3" />
              Purpose
            </h3>
            <p className="text-sm text-[#1B2A4B]">{item.description}</p>
          </div>
        )}

        {asArray(item.presentation_type).includes('Presentation(s)') && item.presentation_description && (
          <div className="border-t border-[#D6DAE3] pt-3">
            <h3 className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#5A6781]">
              <AlignLeft className="h-3 w-3" />
              Presentation description
            </h3>
            <p className="text-sm text-[#1B2A4B]">{item.presentation_description}</p>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}