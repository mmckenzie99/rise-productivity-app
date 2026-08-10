// IMPORTANT: The rolling-wheel option picker (single WheelColumn in a bottom
// sheet on mobile / a centered dialog on desktop) is the INTENTIONAL, universal
// implementation for EVERY viewport. It must NOT be replaced with a native
// <select> or a plain popover list in any future mobile / App Store optimisation
// pass. Always render the WheelColumn via WheelSheet; never branch on viewport
// width.
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import WheelColumn from './WheelColumn';
import WheelSheet from './WheelSheet';

/**
 * Single-value option picker. `options` is an array of { value, label }.
 * The rolling wheel is always the picker on every viewport. Same trigger
 * button, label, value/onChange, and props as before.
 */
export default function OptionWheelPicker({ options, value, onChange, label, placeholder = 'Select…', className }) {
  const [open, setOpen] = useState(false);
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

  return (
    <WheelSheet open={open} onOpenChange={setOpen} label={label} trigger={triggerEl}>
      <div className="relative flex">
        <div className="pointer-events-none absolute inset-y-0 left-3 right-3 top-1/2 h-10 -translate-y-1/2 rounded-md bg-accent" />
        <WheelColumn
          className="flex-1"
          items={options}
          value={value}
          onChange={onChange}
        />
      </div>
    </WheelSheet>
  );
}