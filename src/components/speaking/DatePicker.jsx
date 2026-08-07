import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/speaking';
import WheelColumn from './WheelColumn';

const toDate = (s) => (s ? new Date(`${s}T00:00:00`) : undefined);
const toISO = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function MobileDateWheel({ value, onChange, min, max }) {
  const d = value ? new Date(`${value}T00:00:00`) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  const minY = min ? new Date(`${min}T00:00:00`).getFullYear() : 2000;
  const maxY = max ? new Date(`${max}T00:00:00`).getFullYear() : new Date().getFullYear() + 10;
  const years = [];
  for (let y = minY; y <= maxY; y++) years.push({ value: y, label: String(y) });

  const months = MONTHS.map((m, i) => ({ value: i, label: m }));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

  const commit = (y, m, dd) => {
    const dim = new Date(y, m + 1, 0).getDate();
    let date = new Date(y, m, Math.min(dd, dim));
    if (min && date < new Date(`${min}T00:00:00`)) date = new Date(`${min}T00:00:00`);
    if (max && date > new Date(`${max}T00:00:00`)) date = new Date(`${max}T00:00:00`);
    onChange(toISO(date));
  };

  return (
    <div className="relative flex">
      <div className="pointer-events-none absolute inset-y-0 left-3 right-3 top-1/2 h-10 -translate-y-1/2 rounded-md bg-accent" />
      <WheelColumn className="flex-1" items={months} value={month} onChange={(m) => commit(year, m, day)} />
      <WheelColumn className="flex-1" items={days} value={day} onChange={(dd) => commit(year, month, dd)} />
      <WheelColumn className="flex-1" items={years} value={year} onChange={(y) => commit(y, month, day)} />
    </div>
  );
}

/**
 * Hybrid date picker. Mobile → single Vaul bottom sheet with rolling wheel
 * columns (Month/Day/Year). Desktop → Radix Popover with react-day-picker grid.
 * Only ONE instance is rendered per viewport (useIsMobile), so no duplicate-UI
 * bug. Value/onChange use YYYY-MM-DD.
 */
export default function DatePicker({ value, onChange, className, label, placeholder = 'Pick a date', min, max, disabled: isDisabled = false }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const display = value ? formatDate(value) : placeholder;
  const triggerCls = cn(
    'flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm box-border',
    value ? 'text-foreground' : 'text-muted-foreground',
    isDisabled && 'cursor-not-allowed opacity-50',
    className
  );

  const disabled = {};
  if (min) disabled.before = toDate(min);
  if (max) disabled.after = toDate(max);

  const handleSelect = (d) => {
    onChange(toISO(d));
    setOpen(false);
  };

  const triggerEl = (
    <button type="button" className={triggerCls}>
      <span className="truncate">{display}</span>
      <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
    </button>
  );

  if (isDisabled) {
    return <button type="button" disabled className={triggerCls}>
      <span className="truncate">{display}</span>
      <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
    </button>;
  }

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
            <MobileDateWheel value={value || toISO(new Date())} onChange={onChange} min={min} max={max} />
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerEl}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={toDate(value)} onSelect={handleSelect} disabled={disabled} initialFocus />
      </PopoverContent>
    </Popover>
  );
}