// Unified back-stack coordinator. Provides a single shared entry stack and
// popstate listener so the iOS back gesture closes the correct overlay at
// every level, regardless of whether it was opened via useModalHistory or
// useHistoryModal. This eliminates phantom history entries and double-close
// conflicts that would fail Apple's navigation review.

export const MARKER = 'b44_overlay';
export const stack = [];
let popInstalled = false;
let suppressCount = 0;

const handlePop = () => {
  if (suppressCount > 0) {
    suppressCount -= 1;
    return;
  }
  const top = stack[stack.length - 1];
  if (top && top.close) top.close();
};

export function ensureListener() {
  if (popInstalled) return;
  window.addEventListener('popstate', handlePop);
  popInstalled = true;
}

export function register(entry) {
  stack.push(entry);
  ensureListener();
}

export function unregister(entry) {
  const i = stack.indexOf(entry);
  if (i !== -1) stack.splice(i, 1);
}

export function requestClose(entry) {
  const isTop = entry && stack[stack.length - 1] === entry;
  if (isTop && window.history.state && window.history.state[MARKER]) {
    window.history.back();
  } else {
    unregister(entry);
    if (entry && entry.close) entry.close();
  }
}

// Close every registered overlay and pop all their history entries in one
// go so the back stack returns to the tab root with no phantom steps.
export function dismissAll() {
  const count = stack.length;
  if (!count) return 0;
  const entries = [...stack];
  stack.length = 0;
  entries.forEach((e) => e.close && e.close());
  if (window.history.state && window.history.state[MARKER]) {
    suppressCount += 1;
    window.history.go(-count);
  }
  return count;
}

// Suppress the next popstate's close handling — used after programmatic
// history.go() calls that pop entries already removed from the stack.
export function suppressNextPop() {
  suppressCount += 1;
  ensureListener();
}