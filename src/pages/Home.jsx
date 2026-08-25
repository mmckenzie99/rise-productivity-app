import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AppHeader from '@/components/speaking/AppHeader';
import AddButton from '@/components/speaking/AddButton';

import EngagementMap from '@/components/speaking/EngagementMap';
import Filters from '@/components/speaking/Filters';
import LocationGroup from '@/components/speaking/LocationGroup';

import EngagementForm from '@/components/speaking/EngagementForm';
import EngagementDetail from '@/components/speaking/EngagementDetail';
// (invites removed — no accounts)
import useEngagements from '@/hooks/useEngagements';
import useTrips from '@/hooks/useTrips';
import TripForm from '@/components/speaking/TripForm';
import TripDetail from '@/components/speaking/TripDetail';
import TripListDialog from '@/components/speaking/TripListDialog';
import ArchiveDialog from '@/components/speaking/ArchiveDialog';
import EngagementQuickLook from '@/components/speaking/EngagementQuickLook';
import { tripPlaceKeys, tripHasPlace } from '@/lib/trips';
import { base44 } from '@/api/base44Client';
import { useAppSettings } from '@/hooks/useAppSettings';
import { resolveFeature } from '@/lib/permissions';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import { useHistoryBack } from '@/hooks/useHistoryBack';
// (chat integration removed)

export default function Home() {
  const { user } = useAuth();
  const isAdmin = true;
  const isOwner = true;
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, save, remove, load: loadEngagements } = useEngagements();
  const { items: trips, loading: tripsLoading, save: saveTrip, remove: removeTrip } = useTrips();

  const [filters, setFilters] = useState(() => {
    try { const s = sessionStorage.getItem('homeFilters'); if (s) { const p = JSON.parse(s); return { status: p.status || 'all', progress: p.progress || 'all', search: p.search || '' }; } } catch {}
    return { status: 'all', progress: 'all', search: '' };
  });
  // (invites removed)
  const [archive, setArchive] = useState(false);
  const [formPrefill, setFormPrefill] = useState(null);
  const [users, setUsers] = useState([]);
  const mapRef = useRef(null);
  const [mapFocus, setMapFocus] = useState(null);

  useEffect(() => { (async () => { try { const us = await base44.entities.User.list(); setUsers(us); } catch {} })(); }, []);
  const { settings } = useAppSettings();
  const commentUsers = useMemo(() => users.filter(u => resolveFeature(u, settings, 'can_comment')), [users, settings]);
  const assignableUsers = useMemo(() => users.filter(u => resolveFeature(u, settings, 'can_be_assigned')), [users, settings]);

  useEffect(() => { const h = () => setFilters({ status: 'all', progress: 'all', search: '' }); window.addEventListener('b44:reset-filters', h); return () => window.removeEventListener('b44:reset-filters', h); }, []);
  useEffect(() => { try { sessionStorage.setItem('homeFilters', JSON.stringify(filters)); } catch {} }, [filters]);
  useEffect(() => { const t = setTimeout(() => { try { const y = Number(sessionStorage.getItem('homeScroll')); if (y > 0) window.scrollTo(0, y); } catch {} }, 300); return () => { clearTimeout(t); try { sessionStorage.setItem('homeScroll', String(window.scrollY)); } catch {} }; }, []);

  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // --- URL-driven content modal state (derived from search params) ---
  const engagementId = searchParams.get('engagementId');
  const editEngagement = searchParams.get('editEngagement');
  const quickLookId = searchParams.get('quickLook');
  const tripIdParam = searchParams.get('tripId');
  const editTrip = searchParams.get('editTrip');
  const tripsOpen = searchParams.has('trips');

  const selected = engagementId ? (items.find(x => x.id === engagementId) || null) : null;
  const form = !editEngagement ? false : editEngagement === 'new' ? (formPrefill || true) : (items.find(x => x.id === editEngagement) || false);
  const quickLook = quickLookId ? (items.find(x => x.id === quickLookId) || null) : null;
  const selectedTrip = tripIdParam ? (trips.find(t => t.id === tripIdParam) || null) : null;
  const tripFormOpen = !editTrip ? false : editTrip === 'new' ? true : (trips.find(t => t.id === editTrip) || false);

  // Reset form prefill once the engagement form closes.
  useEffect(() => { if (!editEngagement) setFormPrefill(null); }, [editEngagement]);

  // --- close handlers (history-aware with idx fallback) ---
  const closeEngagement = useHistoryBack('engagementId');
  const closeEditEngagement = useHistoryBack('editEngagement');
  const closeQuickLook = useHistoryBack('quickLook');
  const closeTrip = useHistoryBack('tripId');
  const closeEditTrip = useHistoryBack('editTrip');
  const closeTrips = useHistoryBack('trips');

  const clearParam = useCallback((name) => setSearchParams(prev => { const sp = new URLSearchParams(prev); sp.delete(name); return sp; }, { replace: true }), [setSearchParams]);
  const pushParam = useCallback((fn) => setSearchParams(prev => { const sp = new URLSearchParams(prev); fn(sp); return sp; }), [setSearchParams]);

  // --- stale deep-link cleanup: clear a content-modal param when its referenced
  // item doesn't exist after data has loaded, so stale links land cleanly on Home. ---
  useEffect(() => { if (loading) return; if (engagementId && !items.some(x => x.id === engagementId)) clearParam('engagementId'); }, [engagementId, items, loading, clearParam]);
  useEffect(() => { if (loading) return; if (editEngagement && editEngagement !== 'new' && !items.some(x => x.id === editEngagement)) clearParam('editEngagement'); }, [editEngagement, items, loading, clearParam]);
  useEffect(() => { if (loading) return; if (quickLookId && !items.some(x => x.id === quickLookId)) clearParam('quickLook'); }, [quickLookId, items, loading, clearParam]);
  useEffect(() => { if (tripsLoading) return; if (tripIdParam && !trips.some(t => t.id === tripIdParam)) clearParam('tripId'); }, [tripIdParam, trips, tripsLoading, clearParam]);
  useEffect(() => { if (tripsLoading) return; if (editTrip && editTrip !== 'new' && !trips.some(t => t.id === editTrip)) clearParam('editTrip'); }, [editTrip, trips, tripsLoading, clearParam]);

  // --- action param (one-time, consumed on mount) + in-page quick actions ---
  // Calendar actions migrated to the dedicated /calendar route.
  const navigate = useNavigate();
  const applyAction = (action, replace = false) => {
    if (!action) return;
    const opts = { replace };
    if (action === 'new') setSearchParams({ editEngagement: 'new' }, opts);
    else if (action === 'calendar') navigate('/calendar', opts);
    else if (action === 'new-plan') navigate(`/calendar?planId=new&calDate=${todayStr()}`, opts);
    // (invite action removed — no accounts)
  };
  useEffect(() => { const action = searchParams.get('action'); if (action) applyAction(action, true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { const h = e => applyAction((e.detail && e.detail.type) || '', false); window.addEventListener('b44:quick-action', h); return () => window.removeEventListener('b44:quick-action', h); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const locate = x => { if (Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude))) { setMapFocus({ item: x, nonce: Date.now() }); mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  const tripPlaces = useMemo(() => tripPlaceKeys(trips), [trips]);
  const engagementTrip = selected ? trips.find(t => tripHasPlace(t, selected.place)) : null;

  const edit = x => setSearchParams(prev => { const sp = new URLSearchParams(prev); sp.delete('engagementId'); sp.set('editEngagement', x.id); return sp; });
  const editTripNav = x => setSearchParams(prev => { const sp = new URLSearchParams(prev); sp.delete('tripId'); sp.set('editTrip', x.id); return sp; });
  const viewTripFromEng = () => { if (engagementTrip) setSearchParams(prev => { const sp = new URLSearchParams(prev); sp.delete('engagementId'); sp.set('tripId', engagementTrip.id); return sp; }, { replace: true }); };
  const duplicate = x => { const { id, created_date, updated_date, created_by_id, ...fields } = x; setFormPrefill({ ...fields, title: `${x.title} (Copy)` }); setSearchParams({ editEngagement: 'new' }); };
  const del = async x => { if (window.confirm(`Delete "${x.title}"?`)) { await remove(x.id); return true; } return false; };
  const delTrip = async x => { if (window.confirm('Delete this trip?')) { await removeTrip(x.id); return true; } return false; };

  const openEngagement = x => setSearchParams({ engagementId: x.id });
  const openQuickLook = x => setSearchParams({ quickLook: x.id });

  const visible = useMemo(() => items.filter(x => x.status !== 'Completed' && (filters.status === 'all' || x.status === filters.status) && (filters.progress === 'all' || x.progress === filters.progress) && `${x.place || ''} ${x.title || ''} ${Array.isArray(x.presentation_type) ? x.presentation_type.join(' ') : x.presentation_type || ''}`.toLowerCase().includes(filters.search.toLowerCase())), [items, filters]);
  const archived = useMemo(() => items.filter(x => x.status === 'Completed'), [items]);
  const locationGroups = useMemo(() => { const m = {}; visible.forEach(x => { const k = x.place ? x.place.trim().toLowerCase() : `__n${x.id}`; if (!m[k]) m[k] = { place: x.place, items: [] }; m[k].items.push(x); }); return Object.values(m); }, [visible]);
  const orderedGroups = useMemo(() => {
    const today = todayStr();
    const FAR = new Date(8640000000000000);
    const dateOf = x => x.speaking_date || x.deploy_date;
    const groups = locationGroups.map(g => {
      const items = [...g.items].sort((a, b) => (dateOf(a) || '9999-12-31').localeCompare(dateOf(b) || '9999-12-31'));
      const upcoming = items.filter(x => dateOf(x) && dateOf(x) >= today);
      const nearest = upcoming.length ? new Date(upcoming[0].speaking_date || upcoming[0].deploy_date) : FAR;
      return { place: g.place, items, key: g.place ? g.place.trim().toLowerCase() : `__n${g.items[0].id}`, nearest };
    });
    groups.sort((a, b) => a.nearest - b.nearest);
    return groups;
  }, [locationGroups]);

  return (
    <main className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-9">
        <PullToRefresh onRefresh={async () => { await loadEngagements(); }}>
         <div className="space-y-6">
          <AppHeader />
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="bg-card pl-9 text-sm h-9 border-border" placeholder="Search place or engagement type…" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <AddButton onClick={() => setSearchParams({ editEngagement: 'new' })} label="New engagement" />
          </div>
          <div ref={mapRef}><EngagementMap items={visible} onView={openEngagement} focusItem={mapFocus} /></div>
          <Filters filters={filters} setFilters={setFilters} onArchive={() => setArchive(true)} />
          {loading ? <div className="py-14 text-center">Loading engagements…</div> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{orderedGroups.map((g, i) => <LocationGroup key={g.key} place={g.place} items={g.items} onClick={openEngagement} onDuplicate={duplicate} isAdmin={isAdmin} tripPlaces={tripPlaces} onLocate={locate} />)}</div> : <div className="rounded-lg border border-dashed border-primary bg-card/60 py-14 text-center"><h2 className="font-display text-xl font-semibold">{items.length ? 'Nothing matches' : 'No engagements yet'}</h2><p className="mt-2 text-sm text-muted-foreground">{items.length ? 'Try a different filter.' : isAdmin ? 'Add your first speaking engagement to see it mapped here.' : 'Ask an administrator to add one.'}</p></div>}
         </div>
        </PullToRefresh>
      </div>

      <EngagementForm open={!!form} item={form === true ? null : form} onClose={closeEditEngagement} onSave={save} />
      <EngagementDetail item={selected} onClose={closeEngagement} onEdit={edit} onDelete={del} isAdmin={isAdmin} trip={engagementTrip} onViewTrip={viewTripFromEng} admins={commentUsers} currentUserId={user?.id} />
      {/* invites removed */}
      <TripListDialog open={tripsOpen} trips={trips} loading={tripsLoading} isAdmin={isAdmin} onClose={closeTrips} onAdd={() => pushParam(sp => sp.set('editTrip', 'new'))} onSelect={t => pushParam(sp => sp.set('tripId', t.id))} />
      <TripForm open={!!tripFormOpen} item={tripFormOpen === true ? null : tripFormOpen} engagements={items} onClose={closeEditTrip} onSave={async t => { await saveTrip(t); }} />
      <TripDetail trip={selectedTrip} onClose={closeTrip} onEdit={() => editTripNav(selectedTrip)} onDelete={() => delTrip(selectedTrip)} isAdmin={isAdmin} />
      <EngagementQuickLook item={quickLook} onClose={closeQuickLook} />
      <ArchiveDialog open={archive} onClose={() => setArchive(false)} items={archived} onSelect={x => { setArchive(false); setSearchParams({ engagementId: x.id }); }} isAdmin={isAdmin} tripPlaces={tripPlaces} onLocate={x => { setArchive(false); locate(x); }} onDuplicate={duplicate} />
      <div className="h-28 lg:hidden" />
    </main>
  );
}