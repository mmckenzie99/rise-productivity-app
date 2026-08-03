import { LogOut, Users, CalendarDays, Plane, LayoutDashboard, Menu, MessageCircle, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import Brand from './Brand';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';

const ACTIVE = 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground';
const IDLE = 'border-border bg-card';
const ITEM_HOVER = 'hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground';

export default function AppHeader({ onAdd, onInvite, onCalendar, isAdmin, isOwner, newOpen, calendarOpen, inviteOpen }) {
  const { pathname } = useLocation();
  return (
    <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <Brand />
      <div className="flex flex-wrap items-center gap-2">
        {/* Desktop nav buttons */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/dashboard"><Button variant="outline" className={pathname === '/dashboard' ? ACTIVE : IDLE}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Button></Link>
          <Link to="/chat"><Button variant="outline" className={pathname === '/chat' ? ACTIVE : IDLE}><MessageCircle className="mr-2 h-4 w-4" />Chat</Button></Link>
          <Link to="/trips"><Button variant="outline" className={pathname === '/trips' ? ACTIVE : IDLE}><Plane className="mr-2 h-4 w-4" />Trips</Button></Link>
          <Button variant="outline" onClick={onCalendar} className={calendarOpen ? ACTIVE : IDLE}><CalendarDays className="mr-2 h-4 w-4" />Calendar</Button>
          {(isAdmin || isOwner) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={newOpen || inviteOpen || pathname === '/users' ? ACTIVE : IDLE}><Menu className="mr-2 h-4 w-4" />Manage</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isAdmin && (
                  <DropdownMenuItem className={ITEM_HOVER} onClick={onAdd}>
                    <Plus className="mr-2 h-4 w-4" />New engagement
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem className={ITEM_HOVER} onClick={onInvite}>
                    <Users className="mr-2 h-4 w-4" />Invite
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem className={ITEM_HOVER} asChild>
                    <Link to="/users" className="flex w-full items-center"><Users className="mr-2 h-4 w-4" />Manage Users</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile actions (core navigation lives in the BottomTabBar) */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={IDLE}><Menu className="mr-2 h-4 w-4" />More</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAdmin && (
                <DropdownMenuItem className={ITEM_HOVER} onClick={onAdd}>
                  New engagement
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className={ITEM_HOVER} onClick={onCalendar}>
                <CalendarDays className="mr-2 h-4 w-4" />Calendar
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem className={ITEM_HOVER} onClick={onInvite}>
                  <Users className="mr-2 h-4 w-4" />Invite
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem className={ITEM_HOVER} asChild>
                  <Link to="/users" className="flex w-full items-center"><Users className="mr-2 h-4 w-4" />Manage Users</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ProfileMenu />
        <div className="hidden lg:block"><NotificationBell /></div>
        <Button size="icon" variant="ghost" aria-label="Sign out" className="h-11 w-11 lg:h-9 lg:w-9" onClick={() => base44.auth.logout('/login')}><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}