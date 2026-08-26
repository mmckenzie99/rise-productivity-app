import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CalendarClock, CalendarDays, CheckCircle2, Edit, RefreshCw, Target } from 'lucide-react';
import AppHeader from '@/components/speaking/AppHeader';
import StatCard from '@/components/speaking/StatCard';
import useEngagements from '@/hooks/useEngagements';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import PlanListSection from '@/components/speaking/PlanListSection';
import WeeklyGoalsOverview from '@/components/speaking/WeeklyGoalsOverview';
import DashboardSection from '@/components/dashboard/DashboardSection';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import { useAuth } from '@/lib/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';
import { resolveDashboardSection } from '@/lib/permissions';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const goHome = (action) => navigate(`/engagements?action=${action}`);
  const { items: engagements, loading, load: loadEngagements } = useEngagements();
  const { items: events, load: loadCalEvents } = useCalendarEvents();
  const { settings } = useAppSettings();
  const canSee = (id) => resolveDashboardSection(user, settings, id);

  const today = todayStr();

  const stats = useMemo(() => {
    const upcomingEng = engagements.filter((x) => x.deploy_date && x.deploy_date >= today);
    const completedEng = engagements.filter((x) => x.status === 'Completed');
    const upcomingPlans = events.filter((x) => x.date && x.date >= today && !x.completed);
    const plansThisMonth = events.filter((x) => x.date && x.date.slice(0, 7) === today.slice(0, 7));
    return { upcomingEng, completedEng, upcomingPlans, plansThisMonth };
  }, [engagements, events, today]);

  const planSections = useMemo(() => {
    const upcoming = events.filter((x) => x.date && x.date >= today && !x.completed);
    const completed = events.filter((x) => x.completed);
    const edited = events.filter((x) => x.was_edited);
    const rescheduled = events.filter((x) => x.was_rescheduled);
    return { upcoming, completed, edited, rescheduled };
  }, [events, today]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background pt-safe pb-safe">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </main>
    );
  }

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <PullToRefresh onRefresh={async () => { await loadEngagements(); await loadCalEvents(); }}>
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-9">
          <AppHeader onAdd={() => goHome('new')} />

          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">{greeting()}</h1>
            <p className="text-sm text-muted-foreground">{todayLabel}</p>
          </div>

        {canSee('stat_cards') && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Upcoming Engagements" value={stats.upcomingEng.length} icon={ClipboardList} tone="gold" />
            <StatCard label="Upcoming Plans" value={stats.upcomingPlans.length} icon={CalendarClock} tone="navy" />
            <StatCard label="Plans This Month" value={stats.plansThisMonth.length} icon={CalendarDays} tone="green" />
            <StatCard label="Completed Engagements" value={stats.completedEng.length} icon={CheckCircle2} tone="slate" />
          </div>
        )}

        {canSee('weekly_goals') && (
          <DashboardSection title="Weekly Goals" icon={Target} iconTone="text-primary">
            <WeeklyGoalsOverview />
          </DashboardSection>
        )}

        {canSee('plans') && (
          <DashboardSection title="Plans" icon={CalendarClock} iconTone="text-primary">
            <div className="grid gap-4 sm:grid-cols-2">
              <PlanListSection title="Upcoming Plans" icon={CalendarClock} tone="bg-[#FBF0D0] text-primary" items={planSections.upcoming} emptyText="No upcoming plans" />
              <PlanListSection title="Completed Plans" icon={CheckCircle2} tone="bg-[#D7F0DD] text-[#1E6B3A]" items={planSections.completed} emptyText="No completed plans" />
              <PlanListSection title="Edited Plans" icon={Edit} tone="bg-[#E7EEF6] text-foreground" items={planSections.edited} emptyText="No edited plans" />
              <PlanListSection title="Rescheduled Plans" icon={RefreshCw} tone="bg-[#EDE3F8] text-[#5B2DA0]" items={planSections.rescheduled} emptyText="No rescheduled plans" />
            </div>
          </DashboardSection>
        )}

        </div>
      </PullToRefresh>
      <div className="h-28 lg:hidden" />
    </main>
  );
}