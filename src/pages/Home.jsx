import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AppHeader from '@/components/speaking/AppHeader';

import EngagementMap from '@/components/speaking/EngagementMap';
import Filters from '@/components/speaking/Filters';
import DraggableLocationGroup from '@/components/speaking/DraggableLocationGroup';

import EngagementForm from '@/components/speaking/EngagementForm';
import EngagementDetail from '@/components/speaking/EngagementDetail';
import InviteDialog from '@/components/speaking/InviteDialog';
import useEngagements from '@/hooks/useEngagements';
import useTrips from '@/hooks/useTrips';
import TripForm from '@/components/speaking/TripForm';
import TripDetail from '@/components/speaking/TripDetail';
import TripListDialog from '@/components/speaking/TripListDialog';
import ArchiveDialog from '@/components/speaking/ArchiveDialog';
import EngagementQuickLook from '@/components/speaking/EngagementQuickLook';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { tripPlaceKeys, tripHasPlace } from '@/lib/trips';
import { base44 } from '@/api/base44Client';
import { useAppSettings } from '@/hooks/useAppSettings';
import { resolveFeature } from '@/lib/permissions';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import { useCloseModal } from '@/hooks/useCloseModal';
import { deleteLinkedConversations } from '@/lib/chat';

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isOwner = !!user?.is_owner;
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, loading, save, remove, load: loadEngagements } = useEngagements();
  const { items: trips, loading: tripsLoading, save: saveTrip, remove: removeTrip } = useTrips();

  const [filters, setFilters] = useState(() => {
    try { const s = sessionStorage.getItem('homeFilters'); if (s) { const p = JSON.parse(s); return { status: p.status || 'all', progress: p.progress || 'all', search: p.search || '' }; } } catch {}
    return { status: 'all', progress: 'all', search: '' };
  });
  const [invite, setInvite] = useState(false);
  const [archive, setArchive] = useState(false);
  const [formPrefill, setFormPrefill] = useState(null);
  const [users, setUsers] = useState([]);
  const [placeOrder, setPlaceOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('placeOrder')) || []; } catch { return []; } });
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
  const closeEngagement = useCloseModal('engagementId');
  const closeEditEngagement = useCloseModal('editEngagement');
  const closeQuickLook = useCloseModal('quickLook');
  const closeTrip = useCloseModal('tripId');
  const closeEditTrip = useCloseModal('editTrip');
  const closeTrips = useCloseModal('trips');

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
    else if (action === 'invite') { setInvite(true); if (replace) setSearchParams({}, opts); }
  };
  useEffect(() => { const action = searchParams.get('action'); if (action) applyAction(action, true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { const h = e => applyAction((e.detail && e.detail.type) || '', false); window.addEventListener('b44:quick-action', h); return () => window.removeEventListener('b44:quick-action', h); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const locate = x => { if (Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude))) { setMapFocus({ item: x, nonce: Date.now() }); mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  const tripPlaces = useMemo(() => tripPlaceKeys(trips), [trips]);
  const engagementTrip = selected ? trips.find(t => tripHasPlace(t, selected.place)) : null;

  const edit = x => setSearchParams(prev => { const sp = new URLSearchParams(prev); sp.delete('engagementId'); sp.set('editEngagement', x.id); return sp; }, { replace: true });
  const editTripNav = x => setSearchParams(prev => { const sp = new URLSearchParams(prev); sp.delete('tripId'); sp.set('editTrip', x.id); return sp; }, { replace: true });
  const viewTripFromEng = () => { if (engagementTrip) setSearchParams(prev => { const sp = new URLSearchParams(prev); sp.delete('engagementId'); sp.set('tripId', engagementTrip.id); return sp; }, { replace: true }); };
  const duplicate = x => { const { id, created_date, updated_date, created_by_id, ...fields } = x; setFormPrefill({ ...fields, title: `${x.title} (Copy)` }); setSearchParams({ editEngagement: 'new' }); };
  const del = async x => { if (window.confirm(`Delete "${x.title}"?`)) { await remove(x.id); await deleteLinkedConversations(x.id, 'engagement'); return true; } return false; };
  const delTrip = async x => { if (window.confirm('Delete this trip?')) { await removeTrip(x.id); await deleteLinkedConversations(x.id, 'trip'); return true; } return false; };

  const openEngagement = x => setSearchParams({ engagementId: x.id });
  const openQuickLook = x => setSearchParams({ quickLook: x.id });

  const visible = useMemo(() => items.filter(x => x.status !== 'Completed' && (filters.status === 'all' || x.status === filters.status) && (filters.progress === 'all' || x.progress === filters.progress) && `${x.place || ''} ${x.title || ''} ${Array.isArray(x.presentation_type) ? x.presentation_type.join(' ') : x.presentation_type || ''}`.toLowerCase().includes(filters.search.toLowerCase())), [items, filters]);
  const archived = useMemo(() => items.filter(x => x.status === 'Completed'), [items]);
  const locationGroups = useMemo(() => { const m = {}; visible.forEach(x => { const k = x.place ? x.place.trim().toLowerCase() : `__n${x.id}`; if (!m[k]) m[k] = { place: x.place, items: [] }; m[k].items.push(x); }); return Object.values(m); }, [visible]);
  const orderedGroups = useMemo(() => { const groups = locationGroups.map(g => ({ ...g, key: g.place ? g.place.trim().toLowerCase() : `__n${g.items[0].id}` })); if (placeOrder.length) { const orderMap = new Map(placeOrder.map((k, i) => [k, i])); groups.sort((a, b) => { const ai = orderMap.get(a.key); const bi = orderMap.get(b.key); if (ai !== undefined && bi !== undefined) return ai - bi; if (ai !== undefined) return -1; if (bi !== undefined) return 1; return 0; }); } return groups; }, [locationGroups, placeOrder]);
  const onDragEnd = r => { if (!r.destination) return; const arr = [...orderedGroups]; const [moved] = arr.splice(r.source.index, 1); arr.splice(r.destination.index, 0, moved); const keys = arr.map(g => g.key); setPlaceOrder(keys); try { localStorage.setItem('placeOrder', JSON.stringify(keys)); } catch {} };

  return (
    <main className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-9">
        <PullToRefresh onRefresh={async () => { await loadEngagements(); }}>
          <AppHeader onAdd={() => setSearchParams({ editEngagement: 'new' })} onInvite={() => setInvite(true)} isAdmin={isAdmin} isOwner={isOwner} newOpen={!!editEngagement} inviteOpen={invite} />
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="bg-card pl-9 text-sm h-9 border-border" placeholder="Search place or engagement type…" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <div ref={mapRef}><EngagementMap items={visible} onView={openEngagement} focusItem={mapFocus} /></div>
          <Filters filters={filters} setFilters={setFilters} onArchive={() => setArchive(true)} />
          {loading ? <div className="py-14 text-center">Loading engagements…</div> : visible.length ? <DragDropContext onDragEnd={onDragEnd}><Droppable droppableId="locations">{p => (<div ref={p.innerRef} {...p.droppableProps} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{orderedGroups.map((g, i) => <DraggableLocationGroup key={g.key} id={g.key} index={i} place={g.place} items={g.items} onClick={openEngagement} onDuplicate={duplicate} isAdmin={isAdmin} tripPlaces={tripPlaces} onLocate={locate} />)}{p.placeholder}</div>)}</Droppable></DragDropContext> : <div className="rounded-lg border border-dashed border-primary bg-card/60 py-14 text-center"><h2 className="font-display text-xl font-semibold">{items.length ? 'Nothing matches' : 'No engagements yet'}</h2><p className="mt-2 text-sm text-muted-foreground">{items.length ? 'Try a different filter.' : isAdmin ? 'Add your first speaking engagement to see it mapped here.' : 'Ask an administrator to add one.'}</p></div>}
        </PullToRefresh>
      </div>

      <EngagementForm open={!!form} item={form === true ? null : form} onClose={closeEditEngagement} onSave={save} />
      <EngagementDetail item={selected} onClose={closeEngagement} onEdit={edit} onDelete={del} isAdmin={isAdmin} trip={engagementTrip} onViewTrip={viewTripFromEng} admins={commentUsers} currentUserId={user?.id} />
      <InviteDialog open={invite} onClose={() => setInvite(false)} />
      <TripListDialog open={tripsOpen} trips={trips} loading={tripsLoading} isAdmin={isAdmin} onClose={closeTrips} onAdd={() => pushParam(sp => sp.set('editTrip', 'new'))} onSelect={t => pushParam(sp => sp.set('tripId', t.id))} />
      <TripForm open={!!tripFormOpen} item={tripFormOpen === true ? null : tripFormOpen} engagements={items} onClose={closeEditTrip} onSave={async t => { await saveTrip(t); }} />
      <TripDetail trip={selectedTrip} onClose={closeTrip} onEdit={() => editTripNav(selectedTrip)} onDelete={() => delTrip(selectedTrip)} isAdmin={isAdmin} />
      <EngagementQuickLook item={quickLook} onClose={closeQuickLook} />
      <ArchiveDialog open={archive} onClose={() => setArchive(false)} items={archived} onSelect={x => { setArchive(false); setSearchParams({ engagementId: x.id }); }} isAdmin={isAdmin} tripPlaces={tripPlaces} onLocate={x => { setArchive(false); locate(x); }} onDuplicate={duplicate} />
      <div className="h-28 lg:hidden" />
    </main>
  );
}