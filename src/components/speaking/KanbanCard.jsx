import { CalendarDays, MapPin } from 'lucide-react';
import { formatDate, statusTone } from '@/lib/speaking';

export default function KanbanCard({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-[#D6DAE3] bg-white p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex items-center gap-2">
        {item.speaker_photo && (
          <img
            src={item.speaker_photo}
            alt={item.speaker_name}
            className="h-8 w-8 rounded-full object-cover border border-[#D6DAE3]"
            onError={e => (e.target.style.display = 'none')}
          />
        )}
        <p className="text-sm text-[#5A6781]">{item.speaker_name}</p>
      </div>
      <p className="font-display text-base font-semibold leading-tight">{item.title}</p>
      <div className="mt-3 space-y-1 text-xs text-[#5A6781]">
        {item.address && (
          <p className="flex gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#D9A404]" />{item.address}</p>
        )}
        <p className="flex gap-1.5"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{formatDate(item.speaking_date)}{item.start_time && ` · ${item.start_time}`}</p>
      </div>
      <span className={`mt-3 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${statusTone[item.progress] || 'bg-[#E8EAF0] text-[#5A6781]'}`}>
        {item.progress}
      </span>
    </button>
  );
}