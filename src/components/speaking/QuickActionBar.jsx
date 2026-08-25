import { useNavigate } from 'react-router-dom';
import { Plus, CalendarPlus, CalendarDays } from 'lucide-react';
import { calendarUrl, todayStr } from '@/lib/calendarNav';

const BTN = 'flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-medium text-foreground select-none active:opacity-70';

// No-account model: no role gating. Quick actions are available to everyone.
export default function QuickActionBar() {
  const navigate = useNavigate();
  const actions = [
    { key: 'new', label: 'New', icon: Plus, onClick: () => navigate('/engagements?action=new') },
    { key: 'new-plan', label: 'New Plan', icon: CalendarPlus, onClick: () => navigate(calendarUrl({ planId: 'new', calDate: todayStr() })) },
    { key: 'calendar', label: 'Agenda', icon: CalendarDays, onClick: () => navigate('/calendar') },
  ];
  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-md items-stretch px-1">
        {actions.map((a) => (
          <button key={a.key} type="button" onClick={a.onClick} className={BTN}>
            <a.icon className="h-5 w-5 text-primary" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}