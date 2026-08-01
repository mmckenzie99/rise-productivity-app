import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, CalendarPlus, UserPlus, Bell } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';
import { isOwner, isAdmin, resolvePlanFlag } from '@/lib/permissions';
import NotificationBell from './NotificationBell';

const BTN = 'flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium text-foreground select-none active:opacity-70';

export default function QuickActionBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { settings } = useAppSettings();

  const owner = isOwner(user);
  const admin = isAdmin(user);
  const canPlan =
    resolvePlanFlag(user, settings, 'can_create_personal_plans') ||
    resolvePlanFlag(user, settings, 'can_create_work_plans');

  const fire = (type, path) => {
    if (pathname === '/') window.dispatchEvent(new CustomEvent('b44:quick-action', { detail: { type } }));
    else navigate(path);
  };

  const actions = [];
  if (admin) actions.push({ key: 'new', label: 'New', icon: Plus, onClick: () => fire('new', '/?action=new') });
  if (canPlan) actions.push({ key: 'new-plan', label: 'New Plan', icon: CalendarPlus, onClick: () => fire('new-plan', '/?action=new-plan') });
  if (owner) actions.push({ key: 'invite', label: 'Invite', icon: UserPlus, onClick: () => fire('invite', '/?action=invite') });

  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-md items-stretch px-1">
        {actions.map(a => (
          <button key={a.key} type="button" onClick={a.onClick} className={BTN}>
            <a.icon className="h-5 w-5 text-[#D9A404]" />
            {a.label}
          </button>
        ))}
        <div className="flex flex-1 justify-center">
          <NotificationBell
            side="top"
            trigger={({ unreadCount }) => (
              <button type="button" className={BTN} aria-label="Alerts">
                <span className="relative">
                  <Bell className="h-5 w-5 text-[#D9A404]" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#D9A404] px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                Alerts
              </button>
            )}
          />
        </div>
      </div>
    </div>
  );
}