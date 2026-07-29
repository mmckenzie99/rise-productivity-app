import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { asArray } from '@/lib/speaking';

export default function MultiTypeSelect({ label, values = [], options, onChange }) {
  const vals = asArray(values);
  const [open, setOpen] = useState(false);
  const toggle = (opt) => {
    onChange(vals.includes(opt) ? vals.filter((v) => v !== opt) : [...vals, opt]);
  };
  const display = vals.length ? vals.join(', ') : 'Select…';

  const renderRow = (opt) => (
    <button key={opt} type="button" onClick={() => toggle(opt)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent">
      <span className={`flex h-4 w-4 items-center justify-center rounded border ${vals.includes(opt) ? 'border-[#D9A404] bg-[#D9A404]' : 'border-[#D6DAE3]'}`}>
        {vals.includes(opt) && <Check className="h-3 w-3 text-white" />}
      </span>
      {opt}
    </button>
  );

  return (
    <div>
      <Label>{label}</Label>
      {/* Desktop: popover */}
      <div className="hidden sm:block">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" type="button" className="mt-1 w-full justify-between font-normal border-[#D6DAE3] bg-white">
              {display}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <div className="space-y-1">{options.map(renderRow)}</div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Mobile: bottom drawer */}
      <div className="mt-1 sm:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" type="button" className="w-full justify-between font-normal border-[#D6DAE3] bg-white">
              {display}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="pb-safe">
            <DrawerHeader className="text-left">
              <DrawerTitle>{label}</DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[55vh] overflow-y-auto px-2 pb-4">{options.map(renderRow)}</div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}