import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/speaking';

const toDate = (s) => (s ? new Date(`${s}T00:00:00`) : undefined);
const toISO = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '');

/**
 * Custom date picker with a fully CSS-controlled button trigger (w-full,
 * box-border) so it can never overflow its container on iOS — replaces native
 * <input type="date"> which renders a fixed-min-width OS control. Desktop uses
 * a Radix Popover + react-day-picker Calendar; mobile uses a Vaul bottom
 * drawer (same pattern as ResponsiveSelect). Value/onChange use YYYY-MM-DD.
 */
export default function DatePicker({ value, onChange, className, label, placeholder = 'Pick a date', min, max, disabled: isDisabled = false }) {
  const [open, setOpen] = useState(false);
  const display = value ? formatDate(value) : placeholder;
  const triggerCls = cn(
    'flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm box-border',
    value ? 'text-foreground' : 'text-muted-foreground',
    isDisabled && 'opacity-50 cursor-not-allowed',
    className
  );

  const disabled = {};
  if (min) disabled.before = toDate(min);
  if (max) disabled.after = toDate(max);

  const handleSelect = (d) => {
    onChange(toISO(d));
    setOpen(false);
  };

  const renderCalendar = () => (
    <Calendar mode="single" selected={toDate(value)} onSelect={handleSelect} disabled={disabled} initialFocus />
  );

  if (isDisabled) {
    return (
      <button type="button" disabled className={triggerCls}>
        <span className="truncate">{display}</span>
        <CalendarIcon className="h-4 w-4 opacity-50 shrink-0" />
      </button>
    );
  }

  return (
    <>
      {/* Desktop: Popover */}
      <div className="hidden sm:block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={triggerCls}>
              <span className="truncate">{display}</span>
              <CalendarIcon className="h-4 w-4 opacity-50 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {renderCalendar()}
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Vaul bottom drawer */}
      <div className="sm:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button type="button" className={triggerCls}>
              <span className="truncate">{display}</span>
              <CalendarIcon className="h-4 w-4 opacity-50 shrink-0" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="pb-safe">
            {label && (
              <DrawerHeader className="text-left">
                <DrawerTitle>{label}</DrawerTitle>
              </DrawerHeader>
            )}
            <div className="flex justify-center px-2 pb-4">{renderCalendar()}</div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}