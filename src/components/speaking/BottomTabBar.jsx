import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Plane } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips', label: 'Trips', icon: Plane },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();

  const handleTap = (to) => {
    const match = to === '/' ? pathname === '/' : pathname === to;
    if (match) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('b44:reset-filters'));
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D6DAE3] bg-white/95 pb-safe backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            onClick={() => handleTap(t.to)}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium select-none transition-colors ${
                isActive ? 'text-[#D9A404]' : 'text-[#5A6781]'
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