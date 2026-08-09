import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import WheelColumn from './WheelColumn';

/**
 * Hybrid single-value option picker. Mobile → Vaul bottom sheet with a
 * snap-scroll wheel column (same UX as the time/date wheels). Desktop → Radix
 * Popover with a scrollable list. `options` is an array of { value, label }.
 */
export default function OptionWheelPicker({ options, value, onChange, label, placeholder = 'Select…', className }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const selected = options.find((o) => o.value === value);
  const display = selected ? selected.label : placeholder;

  const triggerCls = cn(
    'flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm box-border',
    selected ? 'text-foreground' : 'text-muted-foreground',
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
            <div className="relative flex">
              <div className="pointer-events-none absolute inset-y-0 left-3 right-3 top-1/2 h-10 -translate-y-1/2 rounded-md bg-accent" />
              <WheelColumn
                className="flex-1"
                items={options}
                value={value}
                onChange={onChange}
              />
            </div>
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
      <PopoverContent className="min-w-[12rem] max-h-[300px] overflow-y-auto p-1" align="start">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => { onChange(o.value); setOpen(false); }}
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition',
              o.value === value ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
            )}
          >
            {o.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}