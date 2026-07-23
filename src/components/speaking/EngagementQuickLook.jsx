import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, MapPin, Clock3, Tags, AlignLeft } from 'lucide-react';
import { formatDate, formatTime, TIMEZONES, asArray } from '@/lib/speaking';

export default function EngagementQuickLook({ item, onClose }) {
  if (!item) return null;
  const isRange = item.end_date && item.end_date !== item.speaking_date;
  return (
    <Dialog open={!!item} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-white sm:max-w-xl">
        <DialogHeader className="text-center items-center">
          <DialogTitle className="font-display text-2xl">{item.place || 'Place not set'}</DialogTitle>
          {item.title && <p className="text-sm font-medium text-[#5A6781]">{item.title}</p>}
        </DialogHeader>

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
          {item.speaking_date && (
            <p className="flex gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#5A6781]" />
              {isRange ? `${formatDate(item.speaking_date)} – ${formatDate(item.end_date)}` : formatDate(item.speaking_date)}
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
              Description
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
      </DialogContent>
    </Dialog>
  );
}