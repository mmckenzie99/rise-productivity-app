import { useCallback, useEffect, useRef } from 'react';
import { register, unregister, requestClose, MARKER } from '@/lib/backStack';

/**
 * Links an overlay (dialog/drawer) to the unified back stack so the iOS
 * swipe-to-go-back gesture closes it instead of navigating away. Shares a
 * single popstate listener and entry stack with useModalHistory so nested
 * overlays from both systems coordinate correctly.
 */
export default function useHistoryModal(open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const entryRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const entry = { close: () => onCloseRef.current() };
    entryRef.current = entry;
    register(entry);
    window.history.pushState({ ...(window.history.state || {}), [MARKER]: true }, '');
    return () => {
      unregister(entry);
      entryRef.current = null;
    };
  }, [open]);

  const requestCloseFn = useCallback(() => {
    requestClose(entryRef.current);
  }, []);

  return requestCloseFn;
}