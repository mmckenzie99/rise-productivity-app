import { Video } from 'lucide-react';

// A small Zoom-branded badge. Rendered as a <span role="button"> (not <button>)
// so it stays valid HTML when nested inside the clickable plan <button> cards.
// Clicking it opens the meeting in a new tab and stops propagation so the
// surrounding card's edit action does not fire.
export default function ZoomBadge({ url, className = '' }) {
  if (!url) return null;
  const open = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') open(e); }}
      title="Open Zoom meeting"
      aria-label="Open Zoom meeting"
      className={`inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#2D8CFF] text-white shadow-sm transition hover:bg-[#1e7be0] ${className}`}
    >
      <Video className="h-3 w-3" />
    </span>
  );
}