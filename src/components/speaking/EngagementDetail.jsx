import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, MapPin, Paperclip, Pencil, Trash2, Download, Plane, FileText } from 'lucide-react';
import { formatDate, formatTime, statusTone, TIMEZONES, asArray } from '@/lib/speaking';
import { generateICS, downloadICS } from '@/lib/icsExport';
import RichTextDisplay from './RichTextDisplay';
import CommentsSection from './CommentsSection';
import useHistoryModal from '@/hooks/useHistoryModal';

export default function EngagementDetail({ item, onClose, onEdit, onDelete, isAdmin, trip, onViewTrip, admins, currentUserId }) {
  const requestClose = useHistoryModal(!!item, onClose);
  if (!item) return null;
  const dateForDisplay = item.speaking_date || item.deploy_date;
  const isRange = item.end_date && item.end_date !== dateForDisplay;
  const isPresentation = asArray(item.presentation_type).includes('Presentation(s)');
  return (
    <Dialog open={!!item} onOpenChange={v => !v && requestClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-xl">
        <DialogHeader className="text-center items-center">
          <DialogTitle className="font-display text-2xl">{item.place || 'Place not set'}</DialogTitle>
          {item.title && <p className="text-sm font-medium text-muted-foreground">{item.title}</p>}
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs ${statusTone[item.status]}`}>{item.status}</span>
          <span className="rounded-full border border-border px-3 py-1 text-xs">{item.progress}</span>
          {asArray(item.presentation_type).map(t => <span key={t} className="rounded-full border border-border px-3 py-1 text-xs">{t}</span>)}
        </div>
        {item.description && <p>{item.description}</p>}
        <div className="space-y-2 text-sm">
          <p className="flex gap-2">
            <CalendarDays className="h-4 w-4" />
            {isRange ? `${formatDate(dateForDisplay)} – ${formatDate(item.end_date)}` : formatDate(dateForDisplay)}
            {item.start_time && ` · ${formatTime(item.start_time)}${item.end_time ? `–${formatTime(item.end_time)}` : ''}`}
            {item.timezone && ` (${TIMEZONES.find(z => z.value === item.timezone)?.label || item.timezone})`}
          </p>
          {item.address && <p className="flex gap-2"><MapPin className="h-4 w-4" />{item.address}</p>}
        </div>
        {isPresentation && item.presentation_description && (
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-wider">Presentation description</h3>
            <div className="mt-1 text-sm"><RichTextDisplay html={item.presentation_description} /></div>
          </section>
        )}
        {isPresentation && (item.start_date || item.deploy_date) && (
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 text-sm">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Creation start</p>
              <p className="mt-1">{formatDate(item.start_date)}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Deploy date</p>
              <p className="mt-1">{formatDate(item.deploy_date)}</p>
            </div>
          </div>
        )}
        {item.notes && (
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-wider">Notes</h3>
            <div className="mt-1 text-sm"><RichTextDisplay html={item.notes} /></div>
          </section>
        )}
        {item.attachments?.map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm underline">
            <Paperclip className="h-4 w-4" />{a.name}
          </a>
        ))}
        <CommentsSection engagementId={item.id} engagementTitle={item.place || item.title} engagementDate={item.speaking_date} admins={admins} currentUserId={currentUserId} />
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <button onClick={() => downloadICS(generateICS(item), `${item.title || item.place || 'engagement'}.ics`)} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-[#D9A404] hover:text-[#D9A404]">
            <Download className="h-3.5 w-3.5" />Download .ics
          </button>
          {trip && (
            <button onClick={onViewTrip} className="inline-flex items-center gap-1.5 rounded-md border border-[#1B2A4B] bg-[#1B2A4B] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#2A3D6B]">
              <Plane className="h-3.5 w-3.5" />View Trip Details
            </button>
          )}
        </div>
        {isAdmin && (
          <div className="flex justify-between pt-3">
            <Button variant="destructive" onClick={async () => { if (await onDelete(item)) requestClose(); }}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
            <Button onClick={() => onEdit(item)} className="bg-[#D9A404] hover:bg-[#B89003]"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}