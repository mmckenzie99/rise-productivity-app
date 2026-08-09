import { CalendarDays, MapPin, Paperclip, Copy, MessageCircle, Navigation } from 'lucide-react';
import AddressMapsMenu from './AddressMapsMenu';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatTime, statusTone, TIMEZONES, asArray } from '@/lib/speaking';
import CardWrapper from './CardWrapper';
import CountdownBadge from './CountdownBadge';

const ACCENT = { Planning: 'border-l-primary', Confirmed: 'border-l-foreground', Completed: 'border-l-muted-foreground' };

export default function EngagementCard({ item, onClick, onDuplicate, isAdmin, hasTrip, onLocate }) {
  const navigate = useNavigate();
  const dateForDisplay = item.speaking_date || item.deploy_date;
  const isRange = item.end_date && item.end_date !== dateForDisplay;
  return (
    <CardWrapper onClick={() => onClick(item)} className={`group relative cursor-pointer border-l-4 ${ACCENT[item.status]} p-5 text-left transition hover:-translate-y-1 hover:shadow-lg`}>
      {isAdmin && onDuplicate && (
        <button type="button" aria-label="Duplicate" title="Duplicate" onClick={e => { e.stopPropagation(); onDuplicate(item); }} className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:border-primary hover:text-primary">
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="mb-3 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-medium uppercase ${statusTone[item.status]}`}>
          <span className="h-2 w-2 rounded-full bg-current" />{item.status}
        </span>
        <CountdownBadge date={dateForDisplay} />
      </div>
      {/* Place front and center */}
      <div className="flex flex-col text-left">
        <p className="select-none font-display text-lg font-semibold leading-tight w-full">{item.place || 'Place not set'}</p>
        {item.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
      </div>
      <div className="my-4 h-px bg-border" />
      <div className="space-y-2 text-xs text-muted-foreground">
        {item.address && (
          <div className="flex items-start gap-1">
            {Number.isFinite(Number(item.latitude)) ? (
              <button type="button" onClick={e => { e.stopPropagation(); onLocate(item); }} className="flex flex-1 gap-2 text-left transition hover:text-primary">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />{item.address}
              </button>
            ) : (
              <p className="flex flex-1 gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />{item.address}</p>
            )}
            <AddressMapsMenu address={item.address} className="shrink-0 text-muted-foreground hover:text-primary">
              <Navigation className="h-3.5 w-3.5" />
            </AddressMapsMenu>
          </div>
        )}
        <p className="flex gap-2">
          <CalendarDays className="h-4 w-4" />
          {isRange ? `${formatDate(dateForDisplay)} – ${formatDate(item.end_date)}` : formatDate(dateForDisplay)}
          {item.start_time && ` · ${formatTime(item.start_time)}`}
          {item.timezone && ` ${TIMEZONES.find(z => z.value === item.timezone)?.label || item.timezone}`}
        </p>
        {item.attachments?.length > 0 && (
          <p className="flex gap-2"><Paperclip className="h-4 w-4" />{item.attachments.length} attachment{item.attachments.length === 1 ? '' : 's'}</p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px] md:text-[10px]">
        <span className="rounded-full border border-border px-2 py-1">{item.progress}</span>
        {asArray(item.presentation_type).map(t => <span key={t} className="rounded-full border border-border px-2 py-1">{t}</span>)}
        {hasTrip && <span className="rounded-full border border-primary bg-primary/10 px-2 py-1 text-foreground">Trip</span>}
        <button type="button" onClick={e => { e.stopPropagation(); navigate(`/chat?linkType=engagement&linkedId=${item.id}`); }} className="ml-auto inline-flex items-center gap-1 rounded-full border border-[#1B2A4B] bg-[#1B2A4B] px-2 py-1 font-body text-[10px] font-medium text-white transition hover:bg-[#2A3D6B]">
          <MessageCircle className="h-3 w-3" />Chat
        </button>
      </div>
    </CardWrapper>
  );
}