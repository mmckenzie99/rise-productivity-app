import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CollapsibleSection({ title, icon: Icon, iconTone = 'text-[#D9A404]', defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 p-4 text-left"
      >
        {Icon && <Icon className={`h-4 w-4 ${iconTone}`} />}
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <ChevronDown className={`ml-auto h-5 w-5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}