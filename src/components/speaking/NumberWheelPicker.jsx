import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import WheelColumn from './WheelColumn';
import WheelSheet from './WheelSheet';

// Rolling-wheel picker for a numeric quantity. Renders a trigger button (like
// DatePicker/TimePicker) that opens a WheelSheet with a single WheelColumn of
// values from min→max by step. Value/onChange use a Number (or ''/null for none).
export default function NumberWheelPicker({ value, onChange, label, placeholder = '0', min = 0, max = 100, step = 1, className }) {
  const [open, setOpen] = useState(false);
  const current = value === '' || value == null ? null : Number(value);

  const items = [];
  for (let v = min; v <= max; v += step) items.push({ value: v, label: String(v) });

  const wheelValue = current == null
    ? min
    : (items.find((it) => it.value === current)?.value ??
      items.reduce((best, it) => (Math.abs(it.value - current) < Math.abs(best.value - current) ? it : best), items[0]).value);

  const display = current != null ? String(current) : placeholder;
  const triggerCls = cn(
    'flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm box-border',
    current != null ? 'text-foreground' : 'text-muted-foreground',
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
      <div className="relative flex">
        <div className="pointer-events-none absolute inset-y-0 left-3 right-3 top-1/2 h-10 -translate-y-1/2 rounded-md bg-primary/10 ring-1 ring-inset ring-primary/30" />
        <WheelColumn className="flex-1" items={items} value={wheelValue} onChange={onChange} />
      </div>
    </WheelSheet>
  );
}