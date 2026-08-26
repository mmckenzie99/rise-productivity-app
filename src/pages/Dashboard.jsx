import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ClipboardList, CalendarClock, CalendarDays, CheckCircle2, Edit, RefreshCw, PieChart as PieChartIcon, BarChart as BarChartIcon, Target } from 'lucide-react';
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = { Planning: '#D9A404', Confirmed: '#1B2A4B', Completed: '#5A6781' };
const CAT_COLORS = { Personal: '#5B2DA0', Work: '#1B4A6B' };

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

  const statusData = useMemo(() => {
    const counts = { Planning: 0, Confirmed: 0, Completed: 0 };
    engagements.forEach((x) => { if (counts[x.status] !== undefined) counts[x.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [engagements]);

  const monthlyData = useMemo(() => {
    const map = {};
    stats.upcomingEng.forEach((x) => {
      const m = x.deploy_date.slice(0, 7);
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ month: MONTHS[Number(k.slice(5, 7)) - 1], engagements: v }));
  }, [stats.upcomingEng]);

  const categoryData = useMemo(() => {
    const counts = { Personal: 0, Work: 0 };
    stats.upcomingPlans.forEach((x) => { if (counts[x.category] !== undefined) counts[x.category]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [stats.upcomingPlans]);

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

        <div className="grid gap-4 sm:grid-cols-2">
          {canSee('status_chart') && (
            <DashboardSection title="Engagements by status" icon={PieChartIcon} iconTone="text-primary">
              <div className="flex flex-col items-center">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {statusData.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {statusData.map((e) => (
                    <span key={e.name} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[e.name] }} />
                      {e.name} <span className="font-semibold text-foreground">{e.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </DashboardSection>
          )}

          {canSee('category_chart') && (
            <DashboardSection title="Upcoming plans by category" icon={PieChartIcon} iconTone="text-[#1B4A6B]">
              <div className="flex flex-col items-center">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {categoryData.map((e) => <Cell key={e.name} fill={CAT_COLORS[e.name]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {categoryData.map((e) => (
                    <span key={e.name} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ background: CAT_COLORS[e.name] }} />
                      {e.name} <span className="font-semibold text-foreground">{e.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </DashboardSection>
          )}
        </div>

        {canSee('monthly_chart') && (
          <DashboardSection title="Upcoming engagements by month" icon={BarChartIcon} iconTone="text-primary">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="engagements" fill="#D9A404" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardSection>
        )}

        </div>
      </PullToRefresh>
      <div className="h-28 lg:hidden" />
    </main>
  );
}