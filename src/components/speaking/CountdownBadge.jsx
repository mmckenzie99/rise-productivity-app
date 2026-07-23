import { CalendarDays } from 'lucide-react';
import { daysUntil, formatDate } from '@/lib/speaking';

export default function CountdownBadge({ date, showDate = false }) {
  if (!date) return null;
  const days = daysUntil(date);
  if (days < 0) return null;
  const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`;
  return (
    <>
      <span className="inline-flex items-center gap-1 rounded-full border border-[#D9A404] bg-[#D9A404]/10 px-2 py-0.5 font-mono text-[10px] text-[#1B2A4B]">
        <CalendarDays className="h-3 w-3" />{label}
      </span>
      {showDate && <span className="font-mono text-[10px] text-[#5A6781]">{formatDate(date)}</span>}
    </>
  );
}