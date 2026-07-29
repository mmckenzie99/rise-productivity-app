import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Plus, Building2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useTrips from '@/hooks/useTrips';
import useEngagements from '@/hooks/useEngagements';
import { formatCurrency, getTripStatus, formatPlaces } from '@/lib/trips';
import TripForm from '@/components/speaking/TripForm';
import TripDetail from '@/components/speaking/TripDetail';
import BottomTabBar from '@/components/speaking/BottomTabBar';
import PullToRefresh from '@/components/speaking/PullToRefresh';

const FILTERS = ['all', 'upcoming', 'completed'];

export default function Trips() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { items: trips, loading, save, remove, load } = useTrips();
  const { items: engagements } = useEngagements();
  const [filter, setFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const counts = useMemo(() => ({
    all: trips.length,
    upcoming: trips.filter(t => getTripStatus(t) === 'upcoming').length,
    completed: trips.filter(t => getTripStatus(t) === 'completed').length,
  }), [trips]);

  const visible = useMemo(() => {
    const sorted = [...trips].sort((a, b) => (b.leave_date || '').localeCompare(a.leave_date || ''));
    if (filter === 'all') return sorted;
    return sorted.filter(t => getTripStatus(t) === filter);
  }, [trips, filter]);

  const edit = (trip) => { setSelected(null); setFormOpen(trip); };
  const del = async (trip) => {
    if (window.confirm('Delete this trip?')) {
      await remove(trip.id);
      setSelected(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#1B2A4B] pt-safe pb-safe">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-9">
        <PullToRefresh onRefresh={load}>
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#5A6781] hover:text-[#1B2A4B]">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          {isAdmin && (
            <Button onClick={() => setFormOpen(true)} className="bg-[#D9A404] hover:bg-[#B89003]">
              <Plus className="mr-2 h-4 w-4" />New Trip
            </Button>
          )}
        </div>

        <h1 className="font-display text-3xl font-bold">Trips</h1>

        {/* Filters */}
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${filter === f ? 'bg-[#1B2A4B] text-white' : 'bg-white text-[#1B2A4B] border border-[#D6DAE3]'}`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Trip list */}
        {loading ? (
          <div className="py-14 text-center text-sm text-[#5A6781]">Loading trips…</div>
        ) : visible.length ? (
          <div className="space-y-3">
            {visible.map(t => {
              const status = getTripStatus(t);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="flex w-full items-center gap-4 rounded-lg border border-[#D6DAE3] bg-white p-4 text-left transition hover:border-[#D9A404]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F7F8FA]">
                    <img src="https://media.base44.com/images/public/6a60116b6ae7a4bd8b520b63/4323b7e34_ChatGPTImageJul22202605_46_19PM.png" alt="Trip logo" className="h-7 w-7 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1B2A4B]">{formatPlaces(t)}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[#5A6781]">
                      <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{t.department}</span>
                      {t.leave_date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />{t.leave_date}{t.return_date ? ` → ${t.return_date}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                      {status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                    <span className="text-sm font-semibold text-[#1B2A4B]">{formatCurrency(t.total_cost)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#D9A404] bg-white/60 py-14 text-center">
            <h2 className="font-display text-xl font-semibold">{trips.length ? 'Nothing matches' : 'No trips yet'}</h2>
            <p className="mt-2 text-sm text-[#5A6781]">
              {trips.length ? 'Try a different filter.' : isAdmin ? 'Create a trip and link it to a place.' : 'No trip details have been added.'}
            </p>
          </div>
        )}
        </PullToRefresh>
      </div>

      <TripForm open={!!formOpen} item={formOpen === true ? null : formOpen} engagements={engagements} onClose={() => setFormOpen(false)} onSave={async t => { await save(t); setFormOpen(false); }} />
      <TripDetail trip={selected} onClose={() => setSelected(null)} onEdit={() => edit(selected)} onDelete={() => del(selected)} isAdmin={isAdmin} />
      <div className="h-16 lg:hidden" />
      <BottomTabBar />
    </main>
  );
}