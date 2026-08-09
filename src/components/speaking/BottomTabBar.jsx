import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Plane, MessageCircle, Inbox as InboxIcon, Plus } from 'lucide-react';
import QuickActionBar from './QuickActionBar';

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips', label: 'Trips', icon: Plane },
  { to: '/inbox', label: 'Inbox', icon: InboxIcon },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
];

const tabOf = (p) => {
  if (p === '/') return '/';
  const seg = '/' + (p.split('/')[1] || '');
  return TABS.some((t) => t.to === seg) ? seg : null;
};

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Remember the last path visited under each tab so returning to a tab
  // restores its previous view (per-tab history / stack preservation).
  useEffect(() => {
    const t = tabOf(pathname);
    if (t) {
      try { sessionStorage.setItem('b44:tabPath:' + t, pathname); } catch {}
    }
  }, [pathname]);

  const modalCount = () => {
    return document.querySelectorAll('[role="dialog"][data-state="open"]').length;
  };

  const handleTap = (e, to) => {
    const isCurrent = tabOf(pathname) === to;
    const open = modalCount();
    if (isCurrent) {
      // Already on this tab: pop any open modals/sheets back to the tab root
      // (native iOS "tap selected tab to go home"). If we're deeper in the
      // tab's stack (e.g. /chat/:roomId), reset to the tab root page.
      e.preventDefault();
      if (open > 0) {
        window.dispatchEvent(new CustomEvent('b44:dismiss-modals'));
      }
      if (pathname !== to) {
        navigate(to);
        return;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('b44:reset-filters'));
      return;
    }
    // Switching tabs: dismiss any open modals first so the back stack stays
    // clean, then restore this tab's last path (per-tab history).
    e.preventDefault();
    let target = to;
    try {
      const saved = sessionStorage.getItem('b44:tabPath:' + to);
      if (saved && tabOf(saved) === to) target = saved;
    } catch {}
    const go = () => navigate(target);
    if (open > 0) {
      window.dispatchEvent(new CustomEvent('b44:dismiss-modals'));
      let done = false;
      const onPop = () => {
        if (done) return;
        done = true;
        window.removeEventListener('popstate', onPop);
        go();
      };
      window.addEventListener('popstate', onPop);
      setTimeout(onPop, 160);
    } else {
      go();
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-safe backdrop-blur lg:hidden">
      <QuickActionBar />
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            onClick={(e) => handleTap(e, t.to)}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium select-none transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {t.to === '/inbox' ? (
              <span className="relative">
                <t.icon className="h-5 w-5" />
                <span className="absolute -right-2 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
                  <Plus className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              </span>
            ) : (
              <t.icon className="h-5 w-5" />
            )}
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}