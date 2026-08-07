import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Wraps a scrollable region and shows a subtle gradient fade at the top and/or
 * bottom edge only when more content is available in that direction, so users
 * can tell the area is scrollable. The fade color should match the surface
 * behind the scroll content (defaults to the app card surface).
 */
export default function ScrollFade({ children, className = '', fadeFrom = 'from-card', threshold = 4 }) {
  const ref = useRef(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setAtTop(el.scrollTop <= threshold);
    setAtBottom(max <= 0 || max - el.scrollTop <= threshold);
  }, [threshold]);

  useEffect(() => { update(); }, [update]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={ref} onScroll={update} className={cn('h-full overflow-y-auto overflow-x-hidden', className)}>
        {children}
      </div>
      {!atTop && (
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b to-transparent', fadeFrom)} />
      )}
      {!atBottom && (
        <div className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t to-transparent', fadeFrom)} />
      )}
    </div>
  );
}