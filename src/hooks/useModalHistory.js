import { useEffect, useRef } from 'react';
import { register, unregister, dismissAll, MARKER, suppressNextPop } from '@/lib/backStack';

// Syncs the open-modal stack to browser history so the hardware/browser back
// button closes the top modal natively instead of leaving the page. Each open
// modal pushes a history entry; back pops one and closes the top modal.
// Close-then-open transitions (e.g. opening the editor from the detail view)
// reuse the existing entry via replaceState so no phantom back step is left.
// Entries are registered in the shared back stack so dismiss-all (tab switch)
// accounts for overlays opened via useHistoryModal too.

export default function useModalHistory(modals) {
  // modals: [{ key, open, onClose }] in a stable declaration order.
  const openStack = modals.filter((m) => m.open);
  const keysStr = openStack.map((m) => m.key).join('|');

  // stackRef holds the latest open stack for the dismiss handler.
  const stackRef = useRef(openStack);
  stackRef.current = openStack;
  const prevKeysRef = useRef(keysStr);
  // Set when a close is triggered by the back gesture (popstate) so the diff
  // effect knows not to call history.go() again (the pop already happened).
  const poppingRef = useRef(false);
  const entriesRef = useRef({});

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

    // Unregister closed entries from the shared back stack.
    closed.forEach((k) => {
      const e = entriesRef.current[k];
      if (e) { unregister(e); delete entriesRef.current[k]; }
    });
    // Register opened entries in the shared back stack.
    opened.forEach((k) => {
      const m = openStack.find((x) => x.key === k);
      if (m) {
        const entry = { close: () => { poppingRef.current = true; m.onClose(); } };
        entriesRef.current[k] = entry;
        register(entry);
      }
    });

    if (net === 0 && opened.length > 0) {
      // A modal swapped in for another: reuse the current history entry.
      window.history.replaceState({ ...(window.history.state || {}), [MARKER]: true }, '');
    } else if (net > 0) {
      for (let i = 0; i < net; i++) {
        window.history.pushState({ ...(window.history.state || {}), [MARKER]: true }, '');
      }
    } else if (net < 0) {
      if (poppingRef.current) {
        // Close was triggered by popstate — the history pop already happened.
        poppingRef.current = false;
      } else {
        // Programmatic close: pop the history entries, suppressing the shared
        // popstate handler so it doesn't close the next overlay down.
        suppressNextPop();
        window.history.go(net);
      }
    }
    prevKeysRef.current = cur;
  }, [keysStr]);

  // Dismiss-all (tab switch): close every overlay from both systems and pop
  // all their history entries in one go via the shared coordinator.
  useEffect(() => {
    const onDismiss = () => {
      if (stackRef.current.length === 0) return;
      prevKeysRef.current = '';
      stackRef.current = [];
      entriesRef.current = {};
      dismissAll();
    };
    window.addEventListener('b44:dismiss-modals', onDismiss);
    return () => window.removeEventListener('b44:dismiss-modals', onDismiss);
  }, []);
}