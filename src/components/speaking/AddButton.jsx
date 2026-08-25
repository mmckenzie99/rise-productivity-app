import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Consistent "add new" entry-point button: a gold icon-only button showing a
// plus and a checkmark (no text label). Used across the app for every create /
// log / add action so all entry points look the same.
export default function AddButton({ onClick, label = 'New', disabled, className, iconClass = 'h-4 w-4' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-[#D9A404] px-2.5 py-2 text-white transition hover:bg-[#B89003] disabled:pointer-events-none disabled:opacity-40',
        className
      )}
    >
      <Plus className={iconClass} /><Check className={iconClass} />
    </button>
  );
}