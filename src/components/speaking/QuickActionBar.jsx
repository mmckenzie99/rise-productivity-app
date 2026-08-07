import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, CalendarPlus, UserPlus, CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';
import { isOwner, isAdmin, resolvePlanFlag } from '@/lib/permissions';
import { calendarUrl, todayStr } from '@/lib/calendarNav';

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
  if (canPlan) actions.push({ key: 'new-plan', label: 'New Plan', icon: CalendarPlus, onClick: () => navigate(calendarUrl({ planId: 'new', calDate: todayStr() })) });
  actions.push({ key: 'calendar', label: 'Calendar', icon: CalendarDays, onClick: () => navigate('/calendar') });
  if (owner) actions.push({ key: 'invite', label: 'Invite', icon: UserPlus, onClick: () => fire('invite', '/?action=invite') });

  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-md items-stretch px-1">
        {actions.map(a => (
          <button key={a.key} type="button" onClick={a.onClick} className={BTN}>
            <a.icon className="h-5 w-5 text-primary" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}