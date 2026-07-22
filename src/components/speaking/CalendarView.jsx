import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { statusTone, formatDate } from '@/lib/speaking';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarView({ items, onSelect }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const byDate = items
    .filter(x => x.speaking_date)
    .reduce((acc, x) => {
      (acc[x.speaking_date] = acc[x.speaking_date] || []).push(x);
      return acc;
    }, {});

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, muted: false, date: key, engagements: byDate[key] || [] });
  }
  const trailing = 42 - cells.length;
  for (let i = 1; i <= trailing; i++) cells.push({ day: i, muted: true });

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))} className="border-[#D6DAE3] bg-white"><ChevronLeft className="h-4 w-4" /></Button>
        <h3 className="font-display text-xl font-semibold">{MONTHS[month]} {year}</h3>
        <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))} className="border-[#D6DAE3] bg-white"><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="pb-1 text-center font-mono text-[10px] uppercase tracking-wider text-[#5A6781]">{d}</div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`min-h-[72px] rounded-md border p-1.5 ${cell.muted ? 'border-transparent bg-[#F0F2F6]/50 text-[#5A6781]' : cell.date === todayKey ? 'border-[#D9A404] bg-[#FBF0D0]/40' : 'border-[#D6DAE3] bg-white'}`}
          >
            <p className="text-xs font-medium">{cell.day}</p>
            {cell.engagements?.map(eng => (
              <button
                key={eng.id}
                onClick={() => onSelect(eng)}
                className="mt-1 block w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium"
                title={`${eng.title} — ${formatDate(eng.speaking_date)}`}
              >
                <span className={`rounded px-1 ${statusTone[eng.status] || 'bg-[#E8EAF0] text-[#5A6781]'}`}>
                  {eng.title}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}