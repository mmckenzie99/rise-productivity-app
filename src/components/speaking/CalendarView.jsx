import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, calEngagementTone, isMultiDayPlan, planCalTone, planMultiTone } from '@/lib/speaking';
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
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    const byDate = {};
    (items || []).forEach((x) => {
      if (!x.deploy_date) return;
      (byDate[x.deploy_date] = byDate[x.deploy_date] || []).push({ ...x, _kind: 'eng' });
    });
    (events || []).forEach((x) => {
      if (!x.date || isMultiDayPlan(x)) return;
      (byDate[x.date] = byDate[x.date] || []).push({ ...x, _kind: 'event' });
    });

    const multi = (events || []).filter(isMultiDayPlan);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const key = keyOf(d);
      cells.push({ date: d, key, day: d.getDate(), muted: d.getMonth() !== month, entries: byDate[key] || [] });
    }
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const todayKey = keyOf(today);

    const weekBars = (week) => {
      const ws = week[0].date;
      const we = week[6].date;
      return multi.map((ev) => {
        const s = new Date(ev.date + 'T00:00:00');
        const e = new Date(ev.end_date + 'T00:00:00');
        if (e < ws || s > we) return null;
        const segStart = s < ws ? ws : s;
        const segEnd = e > we ? we : e;
        return {
          ev,
          colStart: Math.round((segStart - ws) / 86400000),
          colEnd: Math.round((segEnd - ws) / 86400000),
          extendsLeft: s < ws,
          extendsRight: e > we,
        };
      }).filter(Boolean);
    };

    return (
      <div className="space-y-1">
        <div className="grid grid-cols-7 gap-1 border-b border-[#D6DAE3] pb-1">
          {DAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-[#5A6781]">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => {
          const bars = weekBars(week);
          return (
            <div key={wi}>
              {bars.length > 0 && (
                <div className="mb-0.5 grid grid-cols-7 gap-1">
                  {bars.map((b, i) => (
                    <button
                      key={i}
                      style={{ gridColumn: `${b.colStart + 1} / span ${b.colEnd - b.colStart + 1}` }}
                      onClick={() => onEventSelect?.(b.ev)}
                      title={b.ev.title}
                      className={`flex h-5 items-center truncate rounded px-1 text-[10px] font-medium ${b.ev.completed ? 'bg-[#E5E7EB] text-[#9CA3AF] line-through' : planMultiTone(b.ev)}`}
                    >
                      {b.extendsLeft ? '‹ ' : ''}{b.ev.title}{b.extendsRight ? ' ›' : ''}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-7 gap-1">
                {week.map((cell, ci) => (
                  <div
                    key={ci}
                    onClick={() => { if (!cell.muted) { setMode('day'); setCursor(new Date(cell.key + 'T00:00:00')); } }}
                    className={`min-h-[72px] cursor-pointer rounded-md border p-1.5 ${cell.muted ? 'border-transparent bg-[#F0F2F6]/50 text-[#5A6781]' : cell.key === todayKey ? 'border-[#D9A404] bg-[#FBF0D0]/40' : 'border-[#D6DAE3] bg-white'}`}
                  >
                    <p className="text-xs font-medium">{cell.day}</p>
                    {cell.entries.map((x) => {
                      const isEvent = x._kind === 'event';
                      const tone = isEvent ? planCalTone(x) : calEngagementTone;
                      return (
                        <button
                          key={x.id}
                          onClick={(e) => { e.stopPropagation(); isEvent ? onEventSelect?.(x) : onSelect?.(x); }}
                          className="mt-1 block w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium"
                          title={x.title}
                        >
                          <span className={`rounded px-1 ${isEvent && x.completed ? 'bg-[#E5E7EB] text-[#9CA3AF] line-through' : tone}`}>
                            {isEvent ? x.title : (x.place || 'Engagement')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
        : <DayPlanner items={items} events={events} mode={mode} cursor={cursor} onSelect={onSelect} onEventSelect={onEventSelect} onAddSlot={onAddSlot} onGoToDate={(d) => { setMode('day'); setCursor(new Date(d)); }} />}
    </div>
  );
}