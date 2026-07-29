import { useCallback, useEffect, useRef } from 'react';

/**
 * Links an overlay (dialog/drawer) to the browser history so the iOS
 * swipe-to-go-back gesture closes it instead of navigating away.
 *
 * Returns a `requestClose` function to call from dismiss UI (X / cancel /
 * backdrop). It pops the pushed history entry, which fires popstate → onClose.
 */
export default function useHistoryModal(open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ base44Modal: true }, '');
    const onPop = () => onCloseRef.current();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open]);

  const requestClose = useCallback(() => {
    if (window.history.state && window.history.state.base44Modal) {
      window.history.back();
    } else {
      onCloseRef.current();
    }
  }, []);

  return requestClose;
}