import { Flag } from 'lucide-react';

// Shared "Flag as important" toggle used on engagement, trip, task, and fitness
// cards. stopPropagation prevents the parent card's click (navigation) from
// firing when the flag is tapped.
export default function ImportantFlagButton({ flagged, onToggle, size = 16, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle?.(); }}
      aria-label={flagged ? 'Remove important flag' : 'Flag as important'}
      aria-pressed={flagged}
      title={flagged ? 'Remove important flag' : 'Flag as important'}
      className={`inline-flex items-center justify-center rounded-md p-1.5 transition active:scale-90 hover:bg-accent ${className}`}
    >
      <Flag size={size} className={flagged ? 'fill-primary text-primary' : 'text-muted-foreground'} />
    </button>
  );
}