import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Slide + fade transition for pushed (non-tab) detail screens
// (/calendar, /tasks, /users). Uses AnimatePresence mode="popLayout" so the
// exiting screen is popped out of normal flow (overlaid) — letting the
// underlying keep-alive tab become visible immediately without stacking or
// layout shift, while the pushed screen slides+fades out. These routes
// unmount on leave by design (they are NOT part of the tab keep-alive cache),
// so animating their mount/unmount is safe and does not affect tab state.
export default function PushedScreenTransition({ active, children }) {
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {active && (
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}