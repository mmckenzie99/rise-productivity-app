import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, calPlanTone, calEngagementTone } from '@/lib/speaking';
import DayPlanner from './DayPlanner';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const MODES = ['month', 'week', 'day'];

export default function CalendarView({ items, events, onSelect, onEventSelect, onAddSlot }) {
  const today = new Date();
  const [mode, setMode] = useState('month');
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const step = (dir) => {
    if (mode === 'month') {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    } else {
      const d = new Date(cursor);
      d.setDate(d.getDate() + dir * (mode === 'week' ? 7 : 1));
      setCursor(d);
    }
  };

  const headerLabel = () => {
    if (mode === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (mode === 'day') return `${DAYS[cursor.getDay()]}, ${formatDate(keyOf(cursor))}`;
    const sun = new Date(cursor);
    sun.setDate(sun.getDate() - sun.getDay());
    const sat = new Date(sun);
    sat.setDate(sat.getDate() + 6);
    return `${formatDate(keyOf(sun))} – ${formatDate(keyOf(sat))}`;
  };

  const renderMonth = () => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const byDate = {};
    (items || []).forEach((x) => {
      if (!x.deploy_date) return;
      (byDate[x.deploy_date] = byDate[x.deploy_date] || []).push({ ...x, _kind: 'eng' });
    });
    (events || []).forEach((x) => {
      if (!x.date) return;
      (byDate[x.date] = byDate[x.date] || []).push({ ...x, _kind: 'event' });
    });

    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, muted: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, muted: false, date: key, entries: byDate[key] || [] });
    }
    const trailing = 42 - cells.length;
    for (let i = 1; i <= trailing; i++) cells.push({ day: i, muted: true });

    const todayKey = keyOf(today);

    return (
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="pb-1 text-center font-mono text-[10px] uppercase tracking-wider text-[#5A6781]">{d}</div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            onClick={() => { if (!cell.muted && cell.date) { setMode('day'); setCursor(new Date(cell.date + 'T00:00:00')); } }}
            className={`min-h-[72px] cursor-pointer rounded-md border p-1.5 ${cell.muted ? 'border-transparent bg-[#F0F2F6]/50 text-[#5A6781]' : cell.date === todayKey ? 'border-[#D9A404] bg-[#FBF0D0]/40' : 'border-[#D6DAE3] bg-white'}`}
          >
            <p className="text-xs font-medium">{cell.day}</p>
            {cell.entries?.map((x) => {
              const isEvent = x._kind === 'event';
              const tone = isEvent ? calPlanTone : calEngagementTone;
              return (
                <button
                  key={x.id}
                  onClick={(e) => { e.stopPropagation(); isEvent ? onEventSelect?.(x) : onSelect?.(x); }}
                  className="mt-1 block w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium"
                  title={x.title}
                >
                  <span className={`rounded px-1 ${tone}`}>
                    {isEvent ? x.title : (x.place || 'Engagement')}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => step(-1)} className="border-[#D6DAE3] bg-white">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="min-w-[200px] text-center font-display text-xl font-semibold">{headerLabel()}</h3>
          <Button variant="outline" size="icon" onClick={() => step(1)} className="border-[#D6DAE3] bg-white">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${mode === m ? 'bg-[#D9A404] text-white' : 'bg-white text-[#1B2A4B] border border-[#D6DAE3]'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {mode === 'month'
        ? renderMonth()
        : <DayPlanner items={items} events={events} mode={mode} cursor={cursor} onSelect={onSelect} onEventSelect={onEventSelect} onAddSlot={onAddSlot} />}
    </div>
  );
}