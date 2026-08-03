import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Returns a close handler for a URL-driven content modal.
 *
 * When there is a real history entry to pop (`window.history.state.idx > 0`),
 * calling the handler navigates back one step — so the browser/OS back
 * gesture, in-app back buttons, and programmatic closes all behave the same
 * native way.
 *
 * When there is nothing to pop (the modal was opened via a direct deep link
 * with no prior history), the handler instead clears the given search
 * param(s) with `replace` so the modal dismisses without leaving a phantom
 * back step.
 *
 * @param {string|string[]} params — search param name(s) to clear on the fallback path.
 */
export function useHistoryBack(params) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  return () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          (Array.isArray(params) ? params : [params]).forEach((p) => sp.delete(p));
          return sp;
        },
        { replace: true }
      );
    }
  };
}

export default useHistoryBack;