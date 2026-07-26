import { statusTone, formatTime } from '@/lib/speaking';

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

export default function DayPlanner({ items, mode, cursor, onSelect, onAddSlot }) {
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

  const byDate = items
    .filter((x) => x.speaking_date)
    .reduce((acc, x) => {
      (acc[x.speaking_date] = acc[x.speaking_date] || []).push(x);
      return acc;
    }, {});

  const todayKey = keyOf(new Date());

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

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="flex border-b border-[#D6DAE3]">
          <div className="w-12 shrink-0" />
          {days.map((d, i) => (
            <div
              key={i}
              className={`flex-1 px-2 py-1.5 text-center ${keyOf(d) === todayKey ? 'bg-[#FBF0D0]/40' : ''}`}
            >
              <div className="text-[10px] uppercase tracking-wider text-[#5A6781]">
                {DAY_LABELS[d.getDay()]}
              </div>
              <div className={`text-sm font-semibold ${keyOf(d) === todayKey ? 'text-[#D9A404]' : 'text-[#1B2A4B]'}`}>
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex">
          {/* Hour gutter */}
          <div className="w-12 shrink-0">
            <div style={{ height: ALL_DAY_PX }} className="border-b border-transparent" />
            {ROWS.map((h) => (
              <div key={h} className="relative border-b border-[#EDEFF4]" style={{ height: HOUR_PX }}>
                <span className="absolute -top-1.5 right-1 text-[10px] text-[#5A6781]">
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
            const allDay = dayItems.filter((x) => toMin(x.start_time) === null);

            return (
              <div key={di} className="relative flex-1 border-l border-[#D6DAE3]">
                {/* All-day strip */}
                <div
                  className="overflow-hidden border-b border-[#EDEFF4] bg-[#F7F8FA] px-1 py-0.5"
                  style={{ height: ALL_DAY_PX }}
                >
                  {allDay.map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => onSelect(eng)}
                      title={eng.title}
                      className={`mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${statusTone[eng.status] || 'bg-[#E8EAF0] text-[#5A6781]'}`}
                    >
                      {eng.place || eng.title || 'Engagement'}
                    </button>
                  ))}
                </div>

                {/* Time grid */}
                <div
                  className="relative"
                  style={{ height: ROWS.length * HOUR_PX }}
                  onClick={(e) => handleSlotClick(e, key)}
                >
                  {ROWS.map((h) => (
                    <div key={h} className="border-b border-[#EDEFF4]" style={{ height: HOUR_PX }} />
                  ))}
                  {timed.map((eng) => {
                    const sMin = toMin(eng.start_time);
                    const eMinRaw = toMin(eng.end_time);
                    const eMin = eMinRaw && eMinRaw > sMin ? eMinRaw : sMin + 60;
                    const clampS = Math.max(START_HOUR * 60, sMin);
                    const top = (clampS - START_HOUR * 60) * PX_PER_MIN;
                    const maxBottom = ROWS.length * HOUR_PX;
                    const height = Math.max(22, Math.min((eMin - clampS) * PX_PER_MIN, maxBottom - top));
                    return (
                      <button
                        key={eng.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(eng);
                        }}
                        title={`${eng.title} — ${formatTime(eng.start_time)}`}
                        className={`absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-left text-[10px] font-medium shadow-sm ${statusTone[eng.status] || 'bg-[#E8EAF0] text-[#5A6781]'}`}
                        style={{ top, height }}
                      >
                        <div className="truncate font-semibold">{eng.place || eng.title}</div>
                        <div className="opacity-70">{formatTime(eng.start_time)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {onAddSlot && (
          <p className="mt-2 text-[11px] text-[#5A6781]">
            Click an empty time slot to add a plan.
          </p>
        )}
      </div>
    </div>
  );
}