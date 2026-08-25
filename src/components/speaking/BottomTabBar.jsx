import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Plane, CalendarDays, Activity } from 'lucide-react';
import QuickActionBar from './QuickActionBar';

const TABS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/engagements', label: 'Engagements', icon: Users },
  { to: '/trips', label: 'Trips', icon: Plane },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/fitness', label: 'Fitness', icon: Activity },
];

const tabOf = (p) => {
  if (p === '/') return '/';
  const seg = '/' + (p.split('/')[1] || '');
  return TABS.some((t) => t.to === seg) ? seg : null;
};

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const t = tabOf(pathname);
    if (t) {
      try { sessionStorage.setItem('b44:tabPath:' + t, pathname); } catch {}
    }
  }, [pathname]);

  const modalCount = () => document.querySelectorAll('[role="dialog"][data-state="open"]').length;

  const handleTap = (e, to) => {
    const isCurrent = tabOf(pathname) === to;
    const open = modalCount();
    if (isCurrent) {
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
            <t.icon className="h-5 w-5" />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}