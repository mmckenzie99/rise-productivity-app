import { useEffect, useRef } from 'react';

// Syncs the open-modal stack to browser history so the hardware/browser back
// button closes the top modal natively instead of leaving the page. Each open
// modal pushes a history entry; back pops one and closes the top modal.
// Close-then-open transitions (e.g. opening the editor from the detail view)
// reuse the existing entry via replaceState so no phantom back step is left.

export default function useModalHistory(modals) {
  // modals: [{ key, open, onClose }] in a stable declaration order.
  const openStack = modals.filter((m) => m.open);
  const keysStr = openStack.map((m) => m.key).join('|');

  // stackRef holds the latest open stack for the popstate handler.
  const stackRef = useRef(openStack);
  stackRef.current = openStack;
  const prevKeysRef = useRef(keysStr);

  // Push / replace / back to keep history aligned with the open stack.
  useEffect(() => {
    const prev = prevKeysRef.current;
    const cur = keysStr;
    if (prev === cur) return;

    const prevKeys = prev ? prev.split('|') : [];
    const curKeys = cur ? cur.split('|') : [];
    const opened = curKeys.filter((k) => !prevKeys.includes(k));
    const closed = prevKeys.filter((k) => !curKeys.includes(k));
    const net = opened.length - closed.length;

    if (net === 0 && opened.length > 0) {
      // A modal swapped in for another: reuse the current history entry.
      window.history.replaceState({ b44_modal: cur }, '');
    } else if (net > 0) {
      for (let i = 0; i < net; i++) {
        window.history.pushState({ b44_modal: cur }, '');
      }
    } else if (net < 0) {
      window.history.go(net);
    }
    prevKeysRef.current = cur;
  }, [keysStr]);

  // Back button (or programmatic history.go) closes the top open modal.
  useEffect(() => {
    const onPop = () => {
      const stack = stackRef.current;
      if (!stack.length) return;
      const top = stack[stack.length - 1];
      const reduced = stack.slice(0, -1);
      // Pre-update refs so the next render's diff effect sees no change.
      prevKeysRef.current = reduced.map((m) => m.key).join('|');
      stackRef.current = reduced;
      top.onClose();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}