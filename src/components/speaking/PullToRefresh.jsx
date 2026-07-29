import { useRef, useState } from 'react';
import { Loader2, RotateCw } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);

  const onTouchStart = (e) => {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      active.current = true;
    } else {
      startY.current = null;
      active.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (!active.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPull(Math.min(delta * 0.5, 100));
    } else if (delta <= 0) {
      setPull(0);
    }
  };

  const onTouchEnd = async () => {
    if (!active.current) return;
    active.current = false;
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(0);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
      }
    } else {
      setPull(0);
    }
    startY.current = null;
  };

  const offset = refreshing ? 40 : pull;
  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `translateY(${offset}px)`,
        transition: active.current ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      <div className="flex justify-center overflow-hidden" style={{ height: refreshing ? 40 : Math.max(pull - 8, 0) }}>
        {refreshing ? (
          <Loader2 className="mt-2 h-5 w-5 animate-spin text-[#D9A404]" />
        ) : pull > 8 ? (
          <RotateCw className="mt-1 h-4 w-4 text-[#D9A404]" style={{ transform: `rotate(${pull * 3}deg)` }} />
        ) : null}
      </div>
      {children}
    </div>
  );
}