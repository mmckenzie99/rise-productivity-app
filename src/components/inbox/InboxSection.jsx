import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// A collapsible Inbox section: clicking the header toggles its body open/closed.
export default function InboxSection({ icon, title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md py-1 text-left transition hover:bg-accent/50"
      >
        {icon}
        <span className="font-display text-lg font-semibold">{title}</span>
        <span className="text-sm font-normal text-muted-foreground">{count}</span>
        <ChevronDown className={cn('ml-auto h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && children}
    </section>
  );
}