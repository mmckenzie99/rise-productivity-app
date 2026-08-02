import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Plane } from 'lucide-react';
import QuickActionBar from './QuickActionBar';

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips', label: 'Trips', icon: Plane },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const modalCount = () => {
    const s = window.history.state?.b44_modal;
    return s ? s.split('|').length : 0;
  };

  const handleTap = (e, to) => {
    const match = to === '/' ? pathname === '/' : pathname === to;
    const open = modalCount();
    if (match) {
      // Already on this tab: pop any open modals/sheets back to the tab root
      // (native iOS "tap selected tab to go home"), then scroll up and reset.
      e.preventDefault();
      if (open > 0) {
        window.dispatchEvent(new CustomEvent('b44:dismiss-modals'));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('b44:reset-filters'));
    } else if (open > 0) {
      // Switching tabs while modals are open: dismiss them first so the back
      // stack stays clean (no duplicate/phantom entries left behind), then
      // navigate once the history pops settle.
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('b44:dismiss-modals'));
      let done = false;
      const go = () => {
        if (done) return;
        done = true;
        window.removeEventListener('popstate', go);
        navigate(to);
      };
      window.addEventListener('popstate', go);
      setTimeout(go, 160);
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