import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LayoutDashboard, ClipboardList, CalendarClock, CalendarDays, CheckCircle2, Edit, RefreshCw } from 'lucide-react';
import AppHeader from '@/components/speaking/AppHeader';
import StatCard from '@/components/speaking/StatCard';
import useEngagements from '@/hooks/useEngagements';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import PlanListSection from '@/components/speaking/PlanListSection';
import BottomTabBar from '@/components/speaking/BottomTabBar';
import { useAuth } from '@/lib/AuthContext';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = { Planning: '#D9A404', Confirmed: '#1B2A4B', Completed: '#5A6781' };
const CAT_COLORS = { Personal: '#5B2DA0', Work: '#1B4A6B' };

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const goHome = (action) => navigate(`/?action=${action}`);
  const { items: engagements, loading } = useEngagements();
  const { items: events } = useCalendarEvents();

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
      <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] pt-safe pb-safe">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#1B2A4B] pt-safe pb-safe">
      <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-9">
        <AppHeader isAdmin={isAdmin} onAdd={() => goHome('new')} onInvite={() => goHome('invite')} onTimeline={() => goHome('timeline')} />
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-[#D9A404]" />
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Upcoming Engagements" value={stats.upcomingEng.length} icon={ClipboardList} tone="gold" />
          <StatCard label="Upcoming Plans" value={stats.upcomingPlans.length} icon={CalendarClock} tone="navy" />
          <StatCard label="Plans This Month" value={stats.plansThisMonth.length} icon={CalendarDays} tone="green" />
          <StatCard label="Completed Engagements" value={stats.completedEng.length} icon={CheckCircle2} tone="slate" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PlanListSection title="Upcoming Plans" icon={CalendarClock} tone="bg-[#FBF0D0] text-[#D9A404]" items={planSections.upcoming} emptyText="No upcoming plans" />
          <PlanListSection title="Completed Plans" icon={CheckCircle2} tone="bg-[#E6F4EA] text-[#2E7D32]" items={planSections.completed} emptyText="No completed plans" />
          <PlanListSection title="Edited Plans" icon={Edit} tone="bg-[#E7EEF6] text-[#1B2A4B]" items={planSections.edited} emptyText="No edited plans" />
          <PlanListSection title="Rescheduled Plans" icon={RefreshCw} tone="bg-[#EDE3F8] text-[#5B2DA0]" items={planSections.rescheduled} emptyText="No rescheduled plans" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#D6DAE3] bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-semibold">Engagements by status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {statusData.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {statusData.map((e) => (
                <span key={e.name} className="flex items-center gap-1.5 text-xs text-[#5A6781]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[e.name] }} />
                  {e.name} ({e.value})
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#D6DAE3] bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-display text-lg font-semibold">Upcoming plans by category</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {categoryData.map((e) => <Cell key={e.name} fill={CAT_COLORS[e.name]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {categoryData.map((e) => (
                <span key={e.name} className="flex items-center gap-1.5 text-xs text-[#5A6781]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_COLORS[e.name] }} />
                  {e.name} ({e.value})
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#D6DAE3] bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-semibold">Upcoming engagements by month</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5A6781' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#5A6781' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F7F8FA' }} />
                <Bar dataKey="engagements" fill="#D9A404" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex justify-center">
          <Link to="/" className="text-sm font-medium text-[#D9A404] hover:underline">← Back to engagements</Link>
        </div>
      </div>
      <div className="h-16 lg:hidden" />
      <BottomTabBar />
    </main>
  );
}