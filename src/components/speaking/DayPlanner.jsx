import { useRef } from 'react';
import { Check, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatTime, calEngagementTone, planCalTone, planMultiTone, planDateKeys, isMultiDayPlan } from '@/lib/speaking';
import { layoutColumns } from '@/lib/eventLayout';
import WeeklyGoals from './WeeklyGoals';
import WeeklyListSummary from './WeeklyListSummary';

const START_HOUR = 6;
const END_HOUR = 23; // grid spans 6:00 → 23:00
const HOUR_PX = 56;
const PX_PER_MIN = HOUR_PX / 60;
const ALL_DAY_PX = 32; // matches the gutter spacer height

const ROWS = [];
for (let h = START_HOUR; h < END_HOUR; h++) ROWS.push(h);

const keyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const toMin = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const fmtTime = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const hourLabel = (h) => {
  const hr12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr12} ${h >= 12 ? 'PM' : 'AM'}`;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DayPlanner({ items, events, mode, cursor, onSelect, onEventSelect, onAddSlot, onGoToDate, onSelectReflection, canReflect }) {
  const days = [];
  if (mode === 'day') {
    days.push(new Date(cursor));
  } else {
    const sun = new Date(cursor);
    sun.setDate(sun.getDate() - sun.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(sun);
      d.setDate(sun.getDate() + i);
      days.push(d);
    }
  }

  // Merge engagements (keyed by speaking_date) and personal/work plans (keyed by date)
  const merged = [
    ...(items || []).map((e) => ({ ...e, _kind: 'eng', _dateKey: e.speaking_date })),
    ...(events || []).flatMap((e) => planDateKeys(e).map((k) => ({ ...e, _kind: 'event', _dateKey: k }))),
  ];

  const byDate = merged
    .filter((x) => x._dateKey)
    .reduce((acc, x) => {
      (acc[x._dateKey] = acc[x._dateKey] || []).push(x);
      return acc;
    }, {});

  const todayKey = keyOf(new Date());

  const touchStart = useRef(null);
  const swipeDir = useRef(0);

  const shiftDay = (delta) => {
    const d = new Date(cursor);
    d.setDate(d.getDate() + delta);
    swipeDir.current = delta;
    onGoToDate?.(d);
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touchStart.current || mode !== 'day') return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      shiftDay(dx < 0 ? 1 : -1);
    }
  };

  const multiDayEvents = (events || []).filter(isMultiDayPlan);
  const multiDayIds = new Set(multiDayEvents.map((e) => e.id));
  const visKeys = days.map(keyOf);
  const multiBars = multiDayEvents.map((ev) => {
    const idxs = planDateKeys(ev).map((k) => visKeys.indexOf(k)).filter((i) => i >= 0);
    if (!idxs.length) return null;
    return {
      ev,
      startIdx: Math.min(...idxs),
      endIdx: Math.max(...idxs),
      extendsLeft: ev.date < visKeys[0],
      extendsRight: ev.end_date > visKeys[visKeys.length - 1],
    };
  }).filter(Boolean);

  const handleSlotClick = (e, dateKey) => {
    if (!onAddSlot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const raw = START_HOUR * 60 + (y / HOUR_PX) * 60;
    const snapped = Math.max(
      START_HOUR * 60,
      Math.min((END_HOUR - 1) * 60, Math.round(raw / 15) * 15)
    );
    onAddSlot(dateKey, fmtTime(snapped));
  };

  const renderBlock = (x) => {
    const isEvent = x._kind === 'event';
    const tone = isEvent ? planCalTone(x) : calEngagementTone;
    const onClick = (e) => {
      e.stopPropagation();
      isEvent ? onEventSelect?.(x) : onSelect?.(x);
    };
    const label = isEvent ? x.title : (x.place || x.title || 'Engagement');
    const sub = isEvent ? (x.category) : formatTime(x.start_time);
    return (
      <button
        key={x.id}
        onClick={onClick}
        title={isEvent ? `${x.title} — ${formatTime(x.start_time)}` : `${x.title} — ${formatTime(x.start_time)}`}
        className={`absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-left text-[10px] font-medium shadow-sm ${tone} ${isEvent && x.completed ? 'opacity-60' : ''}`}
        style={{ top: x._top + x._col * 16, height: x._height, zIndex: x._col }}
      >
        {isEvent && x.completed && (
          <span className="absolute right-0.5 top-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/90 text-[#1B2A4B] shadow-sm">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
        )}
        <div className="truncate font-semibold">{label}</div>
        <div className="opacity-70">{sub}</div>
      </button>
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className={mode === 'day' ? 'min-w-[320px]' : 'w-full min-w-0'}>
        {mode === 'week' && (
          <div className="mb-3 mt-3">
            <WeeklyGoals cursor={cursor} />
          </div>
        )}
        {mode === 'week' && (
          <div className="mb-4 lg:hidden">
            <WeeklyListSummary
              days={days}
              byDate={byDate}
              onSelect={onSelect}
              onEventSelect={onEventSelect}
              onGoToDate={onGoToDate}
            />
          </div>
        )}
        <div
          className={mode === 'week' ? 'hidden lg:block' : ''}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
        <motion.div
          key={mode === 'day' ? keyOf(cursor) : 'week'}
          initial={mode === 'day' ? { x: swipeDir.current > 0 ? 48 : -48, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
        {/* Day headers */}
        <div className="flex border-b border-foreground/20">
          <div className="w-12 shrink-0" />
          {days.map((d, i) => {
            const dateNum = d.getDate();
            const canJump = mode === 'week' && onGoToDate;
            const isTodayCol = keyOf(d) === todayKey;
            return (
              <div
                key={i}
                className={`relative flex-1 px-2 py-1.5 text-center ${isTodayCol ? 'bg-primary/15' : ''}`}
              >
                <div className="flex items-center justify-center gap-1">
                  {mode === 'day' && (
                    <button
                      type="button"
                      onClick={() => shiftDay(-1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-foreground/15 bg-card text-foreground transition hover:bg-foreground/10"
                      title="Previous day"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div>
                    <div className={`text-[10px] uppercase tracking-wider ${isTodayCol ? 'text-white' : 'text-muted-foreground'}`}>
                      {DAY_LABELS[d.getDay()]}
                    </div>
                    {canJump ? (
                      <button
                        type="button"
                        onClick={() => onGoToDate(new Date(d))}
                        className={`text-sm font-semibold ${isTodayCol ? 'text-primary' : 'text-muted-foreground'} underline-offset-2 hover:text-primary hover:underline focus:text-primary focus:underline`}
                        title="Open day view"
                      >
                        {dateNum}
                      </button>
                    ) : (
                      <div className={`text-sm font-semibold ${keyOf(d) === todayKey ? 'text-primary' : 'text-muted-foreground'}`}>
                        {dateNum}
                      </div>
                    )}
                  </div>
                  {mode === 'day' && (
                    <button
                      type="button"
                      onClick={() => shiftDay(1)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-foreground/15 bg-card text-foreground transition hover:bg-foreground/10"
                      title="Next day"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {canReflect && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectReflection?.(keyOf(d)); }}
                    className="absolute right-1 top-1 text-muted-foreground transition hover:text-[#D9A404]"
                    title="Daily reflection"
                  >
                    <BookOpen className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {multiBars.length > 0 && (
          <div className="flex border-b border-foreground/15">
            <div className="w-12 shrink-0" />
            <div className="relative flex-1 px-0.5" style={{ height: ALL_DAY_PX }}>
              {multiBars.map((b, i) => (
                <button
                  key={i}
                  onClick={() => onEventSelect?.(b.ev)}
                  title={b.ev.title}
                  className={`absolute top-0.5 bottom-0.5 flex items-center truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${b.ev.completed ? 'bg-[#E5E7EB] text-[#9CA3AF] line-through' : planMultiTone(b.ev)}`}
                  style={{ left: `calc(${(b.startIdx / days.length) * 100}% + 2px)`, width: `calc(${((b.endIdx - b.startIdx + 1) / days.length) * 100}% - 4px)` }}
                >
                  {b.extendsLeft ? '‹ ' : ''}{b.ev.title}{b.extendsRight ? ' ›' : ''}
                  {b.ev.completed && (
                    <span className="absolute right-0.5 top-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/90 text-[#1B2A4B] shadow-sm">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex">
          {/* Hour gutter */}
          <div className="w-12 shrink-0">
            <div style={{ height: ALL_DAY_PX }} className="border-b border-transparent" />
            {ROWS.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR_PX }}>
                <span className="absolute -top-1.5 right-1 text-[10px] text-muted-foreground">
                  {hourLabel(h)}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => {
            const key = keyOf(day);
            const dayItems = byDate[key] || [];
            const timed = dayItems.filter((x) => toMin(x.start_time) !== null);
            const allDay = dayItems.filter((x) => toMin(x.start_time) === null && !(x._kind === 'event' && multiDayIds.has(x.id)));

            const positioned = timed.map((x) => {
              const sMin = toMin(x.start_time);
              const eMinRaw = toMin(x.end_time);
              const eMin = eMinRaw && eMinRaw > sMin ? eMinRaw : sMin + 60;
              const clampS = Math.max(START_HOUR * 60, sMin);
              const top = (clampS - START_HOUR * 60) * PX_PER_MIN;
              const maxBottom = ROWS.length * HOUR_PX;
              const height = Math.max(22, Math.min((eMin - clampS) * PX_PER_MIN, maxBottom - top));
              return { ...x, _top: top, _height: height, _sMin: sMin, _eMin: eMin };
            });

            return (
              <div key={di} className="relative flex-1 border-l border-foreground/15">
                {/* All-day strip */}
                <div
                  className="overflow-hidden border-b border-transparent px-1 py-0.5"
                  style={{ height: ALL_DAY_PX }}
                >
                  {allDay.map((x) => {
                    const isEvent = x._kind === 'event';
                    const tone = isEvent ? planCalTone(x) : calEngagementTone;
                    return (
                      <button
                        key={x.id}
                        onClick={() => (isEvent ? onEventSelect?.(x) : onSelect?.(x))}
                        title={x.title}
                        className={`relative mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${tone} ${isEvent && x.completed ? 'opacity-60' : ''}`}
                      >
                        {isEvent ? x.title : (x.place || x.title || 'Engagement')}
                        {isEvent && x.completed && (
                          <span className="absolute right-0.5 top-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/90 text-[#1B2A4B] shadow-sm">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Time grid */}
                <div
                  className="relative"
                  style={{ height: ROWS.length * HOUR_PX }}
                  onClick={(e) => handleSlotClick(e, key)}
                >
                  {ROWS.map((h) => (
                    <div key={h} style={{ height: HOUR_PX }} />
                  ))}
                  {layoutColumns(positioned).map(renderBlock)}
                </div>
              </div>
            );
          })}
        </div>

        {onAddSlot && (
          <p className="mt-2 text-[11px] text-[#5A6781]">
            Click an empty time slot to add a personal or work plan.
          </p>
        )}
        </motion.div>
        </div>
      </div>
    </div>
  );
}