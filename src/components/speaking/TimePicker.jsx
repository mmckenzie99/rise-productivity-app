// IMPORTANT: The rolling-wheel time picker (Hour/Minute/AM-PM WheelColumn,
// 15-minute increments, in a bottom sheet on mobile / a centered dialog on
// desktop) is the INTENTIONAL, universal implementation for EVERY viewport. It
// must NOT be replaced with a native <input type="time">, a 15-minute time grid,
// or a plain <select> in any future mobile / App Store optimisation pass.
// Always render MobileTimeWheel via WheelSheet; never branch on viewport width.
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/speaking';
import WheelColumn from './WheelColumn';
import WheelSheet from './WheelSheet';

const MINUTES = [0, 15, 30, 45];

function MobileTimeWheel({ value, onChange }) {
  const base = value || '09:00';
  const [h, m] = base.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minute = MINUTES.includes(m) ? m : MINUTES.reduce((best, mm) => Math.abs(mm - m) < Math.abs(best - m) ? mm : best, 0);

  const hours = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
  const minutes = MINUTES.map((mm) => ({ value: mm, label: String(mm).padStart(2, '0') }));
  const ampms = [{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }];

  const commit = (hh12, mm, ap) => {
    let h24 = hh12 % 12;
    if (ap === 'PM') h24 += 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  };

  return (
    <div className="relative flex">
      <div className="pointer-events-none absolute inset-y-0 left-3 right-3 top-1/2 h-10 -translate-y-1/2 rounded-md bg-accent" />
      <WheelColumn className="flex-1" items={hours} value={hour12} onChange={(hh) => commit(hh, minute, ampm)} />
      <WheelColumn className="w-20" items={minutes} value={minute} onChange={(mm) => commit(hour12, mm, ampm)} />
      <WheelColumn className="w-20" items={ampms} value={ampm} onChange={(ap) => commit(hour12, minute, ap)} />
    </div>
  );
}

/**
 * Time picker. Value/onChange use HH:MM (24h). The rolling wheel
 * (Hour/Minute/AM-PM, 15-min increments) is always the picker on every viewport.
 * Same trigger button, label, and props as before.
 */
export default function TimePicker({ value, onChange, className, label, placeholder = 'Pick a time' }) {
  const [open, setOpen] = useState(false);
  const display = value ? formatTime(value) : placeholder;
  const triggerCls = cn(
    'flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm box-border',
    value ? 'text-foreground' : 'text-muted-foreground',
    className
  );

  const triggerEl = (
    <button type="button" className={triggerCls}>
      <span className="truncate">{display}</span>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </button>
  );

  return (
    <WheelSheet open={open} onOpenChange={setOpen} label={label} trigger={triggerEl}>
      <MobileTimeWheel value={value} onChange={onChange} />
    </WheelSheet>
  );
}