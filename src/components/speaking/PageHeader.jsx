import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function PageHeader({ title, onBack, backTo, actions, className, isRootTab = false }) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) return onBack();
    if (backTo) { navigate(backTo); return; }
    navigate(-1);
  };
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-border bg-background/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/80',
        className
      )}
    >
      <div className="relative flex h-14 items-center justify-between px-2">
        {isRootTab && (
          <div aria-hidden className="pointer-events-none h-11 w-11 shrink-0 lg:hidden" />
        )}
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className={cn(
            'h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground transition hover:bg-accent',
            isRootTab ? 'hidden lg:flex' : 'flex'
          )}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate font-display text-xl font-semibold text-foreground">
          {title}
        </h1>
        <div className="flex items-center gap-1">{actions}</div>
      </div>
    </header>
  );
}