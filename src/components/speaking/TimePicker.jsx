import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/speaking';
import WheelColumn from './WheelColumn';

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
 * Hybrid time picker. Mobile → single Vaul bottom sheet with rolling wheel
 * columns (Hour/Minute/AM-PM, 15-min increments). Desktop → Radix Popover with
 * a 15-min time grid. Only ONE instance is rendered per viewport (useIsMobile).
 * Value/onChange use HH:MM (24h).
 */
export default function TimePicker({ value, onChange, className, label, placeholder = 'Pick a time' }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
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

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerEl}</DrawerTrigger>
        <DrawerContent className="pb-safe">
          {label && (
            <DrawerHeader className="text-left">
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-4 pb-2">
            <MobileTimeWheel value={value} onChange={onChange} />
          </div>
          <DrawerFooter className="flex-row justify-end gap-2">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">Done</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: 15-minute grid
  const TIMES = Array.from({ length: 96 }, (_, i) => {
    const hh = Math.floor(i / 4);
    const mm = (i % 4) * 15;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  });
  const handlePick = (t) => { onChange(t); setOpen(false); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerEl}</PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <div className="grid max-h-[280px] grid-cols-4 gap-1 overflow-y-auto p-1">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handlePick(t)}
              className={cn(
                'rounded-md px-2 py-2 text-center text-sm transition',
                t === value ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
              )}
            >
              {formatTime(t)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}