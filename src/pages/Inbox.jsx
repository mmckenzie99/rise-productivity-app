import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Inbox as InboxIcon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useAppSettings } from '@/hooks/useAppSettings';
import { resolveFeature, isAdmin } from '@/lib/permissions';
import { toast } from '@/components/ui/use-toast';
import useInboxItems from '@/hooks/useInboxItems';
import useEngagements from '@/hooks/useEngagements';
import useTrips from '@/hooks/useTrips';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import { isDue, buildTaskPrefill, buildEngagementPrefill, buildTripPrefill } from '@/lib/inbox';
import InboxCaptureForm from '@/components/inbox/InboxCaptureForm';
import InboxItemCard from '@/components/inbox/InboxItemCard';
import EngagementForm from '@/components/speaking/EngagementForm';
import TripForm from '@/components/speaking/TripForm';
import CalendarEventForm from '@/components/speaking/CalendarEventForm';

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, save, remove } = useInboxItems();
  const { items: engagements, save: saveEngagement } = useEngagements();
  const { save: saveTrip } = useTrips();
  const { save: saveCalEvent } = useCalendarEvents();
  const { settings } = useAppSettings();
  const [users, setUsers] = useState([]);

  const [captureOpen, setCaptureOpen] = useState(false);
  const [convert, setConvert] = useState(null); // { type, item }

  const admin = isAdmin(user);

  useEffect(() => {
    (async () => {
      try {
        setUsers(await base44.entities.User.list());
      } catch {}
    })();
  }, []);

  // Auto-open the capture form when reached via the "Capture" quick action.
  useEffect(() => {
    if (searchParams.get('capture') === '1') {
      setCaptureOpen(true);
      const p = new URLSearchParams(searchParams);
      p.delete('capture');
      setSearchParams(p, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commentUsers = useMemo(
    () => users.filter((u) => resolveFeature(u, settings, 'can_comment')),
    [users, settings]
  );
  const assignableUsers = useMemo(
    () => users.filter((u) => resolveFeature(u, settings, 'can_be_assigned')),
    [users, settings]
  );

  // Due items first, then the rest — both newest-first within their group.
  const sorted = useMemo(() => {
    const byNew = (a, b) => (b.created_date || '').localeCompare(a.created_date || '');
    const due = items.filter(isDue).sort(byNew);
    const rest = items.filter((i) => !isDue(i)).sort(byNew);
    return [...due, ...rest];
  }, [items]);

  const handleSave = async (data) => {
    await save(data);
    toast({ title: 'Captured', description: 'Saved to your inbox.' });
  };

  const handleDelete = async (item) => {
    if (window.confirm('Delete this captured message?')) {
      await remove(item.id);
      toast({ title: 'Deleted' });
    }
  };

  const openConvert = (type, item) => setConvert({ type, item });
  const closeConvert = () => setConvert(null);

  const handleConvertSave = async (data) => {
    const type = convert?.type;
    try {
      if (type === 'task') {
        await saveCalEvent(data);
        toast({ title: 'Converted to task', description: 'Saved to your Calendar.' });
        navigate('/calendar');
      } else if (type === 'engagement') {
        await saveEngagement(data);
        toast({ title: 'Converted to engagement', description: 'Saved to Home.' });
        navigate('/');
      } else if (type === 'trip') {
        await saveTrip(data);
        toast({ title: 'Converted to trip', description: 'Saved to Trips.' });
        navigate('/trips');
      }
    } catch (e) {
      toast({ title: 'Could not save', description: e?.message || 'Please try again.' });
      throw e;
    }
  };

  const convertItem = convert?.item;
  const taskPrefill = convertItem ? buildTaskPrefill(convertItem) : null;
  const engagementPrefill = convertItem ? buildEngagementPrefill(convertItem) : null;
  const tripPrefill = convertItem ? buildTripPrefill(convertItem) : null;

  return (
    <main className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-9">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="font-display text-2xl font-semibold">Inbox</h1>
          <button
            onClick={() => setCaptureOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#D9A404] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#B89003]"
          >
            <Plus className="h-4 w-4" />Capture
          </button>
        </div>

        {loading ? (
          <div className="py-14 text-center text-sm text-muted-foreground">Loading inbox…</div>
        ) : sorted.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#D9A404] bg-card/60 py-14 text-center">
            <InboxIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl font-semibold">Nothing captured yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste a message to save it for later.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((item) => (
              <InboxItemCard
                key={item.id}
                item={item}
                onConvert={openConvert}
                onDelete={handleDelete}
                canManageTrips={admin}
              />
            ))}
          </div>
        )}

        <div className="h-28 lg:hidden" />
      </div>

      <InboxCaptureForm open={captureOpen} onClose={() => setCaptureOpen(false)} onSave={handleSave} />

      <CalendarEventForm
        open={convert?.type === 'task'}
        item={taskPrefill}
        admins={commentUsers}
        assignableUsers={assignableUsers}
        currentUserId={user?.id}
        onClose={closeConvert}
        onSave={handleConvertSave}
      />
      <EngagementForm
        open={convert?.type === 'engagement'}
        item={engagementPrefill}
        onClose={closeConvert}
        onSave={handleConvertSave}
      />
      <TripForm
        open={convert?.type === 'trip'}
        item={tripPrefill}
        engagements={engagements}
        onClose={closeConvert}
        onSave={handleConvertSave}
      />
    </main>
  );
}