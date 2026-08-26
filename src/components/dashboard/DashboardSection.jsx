import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function DashboardSection({ title, icon: Icon, iconTone = 'text-primary', defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5 sm:py-4"
      >
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
            <Icon className={`h-4 w-4 ${iconTone}`} />
          </span>
        )}
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
        <ChevronDown className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>}
    </div>
  );
}