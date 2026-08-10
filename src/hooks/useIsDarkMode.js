import { useEffect, useState } from 'react';

/**
 * Returns whether the app is currently in dark mode by reading the `dark`
 * class on <html> (the class `useSystemDarkMode` toggles) and observing it for
 * changes via MutationObserver.
 *
 * Used by portaled overlays (Vaul Drawers / Radix Dialogs portal to
 * document.body) so they can carry the active theme class *themselves*. This
 * guarantees their token-based colours always match the surrounding app theme
 * regardless of how the dark class is applied or whether portal inheritance
 * works in the current environment.
 */
export default function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}