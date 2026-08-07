import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const ITEM_H = 40;
const VISIBLE = 5;

/**
 * Native-style snap-scroll wheel column. Renders spacers above/below so the
 * selected item can center in the viewport. Live-updates onChange as the user
 * scrolls (debounced). Used by DatePicker and TimePicker inside a bottom sheet.
 */
export default function WheelColumn({ items, value, onChange, formatLabel, className }) {
  const ref = useRef(null);
  const snapTimer = useRef(null);

  const pad = Math.floor(VISIBLE / 2);
  const padded = [...Array(pad).fill(null), ...items, ...Array(pad).fill(null)];

  useEffect(() => {
    const idx = items.findIndex((it) => it.value === value);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTop = (idx + pad) * ITEM_H;
    }
  }, [value, items, pad]);

  const handleScroll = () => {
    if (!ref.current) return;
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      const raw = ref.current.scrollTop;
      const idx = Math.round(raw / ITEM_H) - pad;
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const item = items[clamped];
      if (item && item.value !== value) onChange(item.value);
    }, 80);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      style={{ height: ITEM_H * VISIBLE }}
      className={cn('no-scrollbar snap-y snap-mandatory overflow-y-auto', className)}
    >
      {padded.map((it, i) => (
        <div key={i} style={{ height: ITEM_H }} className="flex snap-start items-center justify-center">
          {it ? (
            <span className={cn('text-base', it.value === value ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
              {formatLabel ? formatLabel(it) : it.label}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}