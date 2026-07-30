import { useCallback, useEffect, useRef } from 'react';

/**
 * Links an overlay (dialog/drawer) to the browser history so the iOS
 * swipe-to-go-back gesture closes it instead of navigating away.
 *
 * Nested overlays share a single popstate listener and a stack: only the
 * topmost overlay closes per back/popstate, so dismissing an inner modal
 * (e.g. a plan form opened from the calendar) never also dismisses the
 * modal behind it (e.g. the schedule overview).
 */
const stack = [];
let popInstalled = false;

const onGlobalPop = () => {
  const top = stack[stack.length - 1];
  if (top) top.close();
};

export default function useHistoryModal(open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const entryRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const entry = { close: () => onCloseRef.current() };
    entryRef.current = entry;
    stack.push(entry);
    window.history.pushState({ base44Modal: true }, '');
    if (!popInstalled) {
      window.addEventListener('popstate', onGlobalPop);
      popInstalled = true;
    }
    return () => {
      const i = stack.indexOf(entry);
      if (i !== -1) stack.splice(i, 1);
      entryRef.current = null;
    };
  }, [open]);

  // Returns a `requestClose` function to call from dismiss UI (X / cancel /
  // backdrop). It pops the pushed history entry, which fires popstate →
  // the shared handler closes only the topmost overlay.
  const requestClose = useCallback(() => {
    const entry = entryRef.current;
    const isTop = entry && stack[stack.length - 1] === entry;
    if (isTop && window.history.state && window.history.state.base44Modal) {
      window.history.back();
    } else {
      if (entry) {
        const i = stack.indexOf(entry);
        if (i !== -1) stack.splice(i, 1);
      }
      onCloseRef.current();
    }
  }, []);

  return requestClose;
}