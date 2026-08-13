import { useEffect, useRef } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';
import BottomTabBar from '@/components/speaking/BottomTabBar';

// The five bottom-tab destinations. Each gets a persistent container so that
// switching tabs hides the inactive page (visibility:hidden, NOT display:none)
// rather than unmounting it — preserving its scroll position and in-component
// state across tab switches, matching native iOS UITabBarController behavior.
const TAB_SEGMENTS = ['/', '/dashboard', '/trips', '/inbox', '/chat'];

const tabSegment = (pathname) => {
  if (pathname === '/') return '/';
  const seg = '/' + (pathname.split('/')[1] || '');
  return TAB_SEGMENTS.includes(seg) ? seg : null;
};

export default function MainLayout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const activeTab = tabSegment(pathname);
  const isTabRoute = activeTab !== null;

  // Keep-alive cache of each visited tab's outlet element. Stored while the
  // tab is active so it remains available (and mounted) when the tab later
  // becomes inactive. Lazily populated on first visit.
  const cacheRef = useRef({});

  useEffect(() => {
    if (isTabRoute) {
      cacheRef.current[activeTab] = outlet;
    }
  }, [activeTab, outlet, isTabRoute]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="relative flex-1">
        {TAB_SEGMENTS.map((seg) => {
          const isActive = isTabRoute && seg === activeTab;
          const content = isActive ? outlet : cacheRef.current[seg];
          if (!content) return null;
          return (
            <div
              key={seg}
              aria-hidden={!isActive}
              className={isActive
                ? ''
                : 'absolute inset-0 invisible pointer-events-none overflow-hidden'}
            >
              {content}
            </div>
          );
        })}
        {/* Non-tab pushed routes (/calendar, /tasks, /users) render on top of
            the frozen tab containers and unmount on leave, as expected for a
            pushed detail screen. */}
        {!isTabRoute && <div>{outlet}</div>}
      </div>
      <BottomTabBar />
    </div>
  );
}