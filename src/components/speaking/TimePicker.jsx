import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/speaking';

// 15-minute increments cover virtually all scheduling/reminder needs while
// keeping the grid compact and scrollable.
const TIMES = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function TimeList({ value, onPick }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.querySelector(`[data-time="${value}"]`);
    if (el) el.scrollIntoView({ block: 'center' });
  }, [value]);
  return (
    <div ref={ref} className="grid max-h-[280px] grid-cols-3 gap-1 overflow-y-auto p-1 sm:grid-cols-4">
      {TIMES.map((t) => (
        <button
          key={t}
          data-time={t}
          type="button"
          onClick={() => onPick(t)}
          className={cn(
            'rounded-md px-2 py-2 text-center text-sm transition',
            t === value ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
          )}
        >
          {formatTime(t)}
        </button>
      ))}
    </div>
  );
}

/**
 * Custom time picker with a fully CSS-controlled button trigger (w-full,
 * box-border) so it can never overflow its container on iOS — replaces native
 * <input type="time"> which renders a fixed-min-width OS control. Desktop uses
 * a Radix Popover with a time grid; mobile uses a Vaul bottom drawer. Value/
 * onChange use HH:MM (24h), same format the native inputs used.
 */
export default function TimePicker({ value, onChange, className, label, placeholder = 'Pick a time' }) {
  const [open, setOpen] = useState(false);
  const display = value ? formatTime(value) : placeholder;
  const triggerCls = cn(
    'flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm box-border',
    value ? 'text-foreground' : 'text-muted-foreground',
    className
  );
  const handlePick = (t) => { onChange(t); setOpen(false); };

  return (
    <>
      {/* Desktop: Popover */}
      <div className="hidden sm:block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={triggerCls}>
              <span className="truncate">{display}</span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-1" align="start">
            <TimeList value={value} onPick={handlePick} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Vaul bottom drawer */}
      <div className="sm:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button type="button" className={triggerCls}>
              <span className="truncate">{display}</span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="pb-safe">
            {label && (
              <DrawerHeader className="text-left">
                <DrawerTitle>{label}</DrawerTitle>
              </DrawerHeader>
            )}
            <div className="px-2 pb-4">
              <TimeList value={value} onPick={handlePick} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}