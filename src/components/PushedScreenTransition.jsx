import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Slide + fade transition for pushed (non-tab) detail screens
// (/calendar, /tasks, /inbox). The pushed screen slides+fades IN on mount, but
// unmounts INSTANTLY on leave (no exit animation). An exit animation would leave
// the outgoing screen lingering in the same flow container as the keep-alive
// tab underneath, letting it bleed into that tab's scroll space (e.g. Inbox
// content stacking below the Faith page). Instant unmount keeps each pushed
// route fully isolated: it only exists while it is the active route. These
// routes are NOT part of the tab keep-alive cache, so unmounting on leave is
// safe and does not affect tab state.
export default function PushedScreenTransition({ active, children }) {
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {active && (
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}