import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MARKER, stack } from '@/lib/backStack';

/**
 * Pushes a sentinel history entry at the root route so the iOS back gesture
 * never exits the app from the home screen. When the sentinel is popped and
 * no overlay is open, it is re-pushed — the user stays in the app.
 */
export default function useRootBackGuard() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== '/') return;
    const s = window.history.state || {};
    if (!s.b44_guard && !s[MARKER]) {
      window.history.pushState({ b44_guard: true }, '');
    }
  }, [pathname]);

  useEffect(() => {
    const onPop = () => {
      if (window.location.pathname !== '/') return;
      const s = window.history.state || {};
      if (!s.b44_guard && !s[MARKER] && stack.length === 0) {
        window.history.pushState({ b44_guard: true }, '');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}