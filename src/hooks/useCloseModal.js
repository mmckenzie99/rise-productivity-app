import { useSearchParams } from 'react-router-dom';

/**
 * Returns a close handler for a URL-driven content modal that removes only
 * its own search param(s) in place (with `replace`), instead of navigating
 * back. This guarantees a deterministic landing surface:
 *   • closing a plan leaves `calendar=open` in place → calendar view
 *   • closing a trip leaves `trips=open` in place → trip list
 *   • closing an engagement leaves a clean Home
 * regardless of how the modal was opened (deep link vs. in-app nav), so the
 * browser back stack never traps the user on the wrong screen.
 *
 * @param {string|string[]} params — search param name(s) to clear.
 */
export function useCloseModal(params) {
  const [, setSearchParams] = useSearchParams();
  return () =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        (Array.isArray(params) ? params : [params]).forEach((p) => sp.delete(p));
        return sp;
      },
      { replace: true }
    );
}

export default useCloseModal;