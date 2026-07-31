import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Single-select that renders a Radix Select on desktop and a Vaul bottom
 * drawer on mobile viewports, for a native iOS picker feel.
 */
export default function ResponsiveSelect({ value, onValueChange, options, placeholder = 'Select…', triggerClassName, label }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const display = selected ? selected.label : placeholder;

  const handlePick = (v) => {
    onValueChange(v);
    setOpen(false);
  };

  return (
    <>
      {/* Desktop: Radix Select */}
      <div className="hidden sm:block">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={triggerClassName}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value} disabled={o.disabled}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: Vaul bottom drawer */}
      <div className="sm:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button type="button" variant="outline" className={cn('h-9 w-full justify-between font-normal', triggerClassName)}>
              <span className="truncate">{display}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="pb-safe">
            {label && (
              <DrawerHeader className="text-left">
                <DrawerTitle>{label}</DrawerTitle>
              </DrawerHeader>
            )}
            <div className="max-h-[55vh] overflow-y-auto px-2 pb-4">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  disabled={o.disabled}
                  onClick={() => handlePick(o.value)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <Check className="h-4 w-4 shrink-0 text-[#D9A404]" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}