import { LogOut, Users, GanttChart, Plane, LayoutDashboard, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import Brand from './Brand';
import NotificationBell from './NotificationBell';

const ACTIVE = 'bg-[#D9A404] text-white border-[#D9A404] hover:bg-[#B89003] hover:text-white';
const IDLE = 'border-[#D6DAE3] bg-white';
const ITEM_HOVER = 'hover:bg-[#D9A404] hover:text-white focus:bg-[#D9A404] focus:text-white data-[highlighted]:bg-[#D9A404] data-[highlighted]:text-white';

export default function AppHeader({ onAdd, onInvite, onTimeline, isAdmin, newOpen, timelineOpen, inviteOpen }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <header className="flex flex-col gap-5 border-b border-[#D6DAE3] pb-6 sm:flex-row sm:items-center sm:justify-between">
      <Brand />
      <div className="flex flex-wrap items-center gap-2">
        {/* Desktop nav buttons */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link to="/dashboard"><Button variant="outline" className={pathname === '/dashboard' ? ACTIVE : IDLE}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Button></Link>
          {isAdmin && <Button variant="outline" onClick={onAdd} className={newOpen ? ACTIVE : IDLE}>New engagement</Button>}
          <Link to="/trips"><Button variant="outline" className={pathname === '/trips' ? ACTIVE : IDLE}><Plane className="mr-2 h-4 w-4" />Engagement Trips</Button></Link>
          <Button variant="outline" onClick={onTimeline} className={timelineOpen ? ACTIVE : IDLE}><GanttChart className="mr-2 h-4 w-4" />Timeline</Button>
          {isAdmin && <Button variant="outline" onClick={onInvite} className={inviteOpen ? ACTIVE : IDLE}><Users className="mr-2 h-4 w-4" />Invite</Button>}
        </div>

        {/* Mobile menu dropdown */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={IDLE}><Menu className="mr-2 h-4 w-4" />Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className={ITEM_HOVER} onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />Dashboard
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className={ITEM_HOVER} onClick={onAdd}>
                  New engagement
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className={ITEM_HOVER} onClick={() => navigate('/trips')}>
                <Plane className="mr-2 h-4 w-4" />Engagement Trips
              </DropdownMenuItem>
              <DropdownMenuItem className={ITEM_HOVER} onClick={onTimeline}>
                <GanttChart className="mr-2 h-4 w-4" />Timeline
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className={ITEM_HOVER} onClick={onInvite}>
                  <Users className="mr-2 h-4 w-4" />Invite
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <NotificationBell />
        <Button size="icon" variant="ghost" aria-label="Sign out" onClick={() => base44.auth.logout('/login')}><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}