import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomTabBar from '@/components/speaking/BottomTabBar';

// Key transitions by the top-level tab segment so the page instance is
// preserved while navigating within a tab (e.g. /chat -> /chat/:roomId),
// and the BottomTabBar — rendered outside AnimatePresence — never remounts.
const tabSegment = (pathname) => {
  if (pathname === '/') return '/';
  return '/' + (pathname.split('/')[1] || '');
};

export default function MainLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tabSegment(pathname)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomTabBar />
    </div>
  );
}