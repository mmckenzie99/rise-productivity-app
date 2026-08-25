import { LogOut, CalendarDays, Plane, LayoutDashboard, Presentation, Activity, Inbox as InboxIcon, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import Brand from './Brand';
import ProfileMenu from './ProfileMenu';

const ACTIVE = 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground';
const IDLE = 'border-border bg-card';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/engagements', label: 'Engagements', icon: Presentation },
  { to: '/trips', label: 'Trips', icon: Plane },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/fitness', label: 'Fitness', icon: Activity },
  { to: '/inbox', label: 'Inbox', icon: InboxIcon },
];

// No-account model: every workspace member is an equal owner, so the header no
// longer gates actions behind admin/owner roles. The desktop nav covers all
// sections; an optional onAdd renders a direct "New" button for the page.
export default function AppHeader({ onAdd }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  return (
    <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <Brand />
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}>
              <Button variant="outline" className={pathname === n.to ? ACTIVE : IDLE}>
                <n.icon className="mr-2 h-4 w-4" />{n.label}
              </Button>
            </Link>
          ))}
          {onAdd && (
            <Button onClick={onAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />New
            </Button>
          )}
        </div>
        <Link to="/inbox" className="lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Inbox" className="h-11 w-11">
            <InboxIcon className="h-4 w-4" />
          </Button>
        </Link>
        <ProfileMenu />
        <Button size="icon" variant="ghost" aria-label="Leave workspace" className="h-11 w-11 lg:h-9 lg:w-9" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}