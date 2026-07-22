import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { asArray } from '@/lib/speaking';

export default function MultiTypeSelect({ label, values = [], options, onChange }) {
  const vals = asArray(values);
  const toggle = (opt) => {
    onChange(vals.includes(opt) ? vals.filter(v => v !== opt) : [...vals, opt]);
  };
  return (
    <div>
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="mt-1 w-full justify-between font-normal border-[#D6DAE3] bg-white">
            {vals.length ? vals.join(', ') : 'Select…'}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <div className="space-y-1">
            {options.map(opt => (
              <button key={opt} type="button" onClick={() => toggle(opt)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${vals.includes(opt) ? 'bg-[#D9A404] border-[#D9A404]' : 'border-[#D6DAE3]'}`}>
                  {vals.includes(opt) && <Check className="h-3 w-3 text-white" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}