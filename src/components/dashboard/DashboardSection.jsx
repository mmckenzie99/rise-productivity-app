import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function DashboardSection({ title, icon: Icon, iconTone = 'text-primary', defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 p-5 text-left"
      >
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
            <Icon className={`h-4 w-4 ${iconTone}`} />
          </span>
        )}
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <ChevronDown className={`ml-auto h-5 w-5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}