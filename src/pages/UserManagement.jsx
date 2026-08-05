import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, MessageCircle, UserCheck, ShieldCheck, ArrowLeft, CalendarDays, Briefcase, Search, Users as UsersIcon, LayoutDashboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Brand from '@/components/speaking/Brand';
import CollapsibleSection from '@/components/speaking/CollapsibleSection';
import ResponsiveSelect from '@/components/speaking/ResponsiveSelect';
import { useAppSettings, DEFAULT_FEATURES } from '@/hooks/useAppSettings';
import { resolveFeature, resolvePlanFlag, DASHBOARD_SECTIONS } from '@/lib/permissions';

function PermissionToggle({ icon, label, description, checked, disabled, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-primary">{icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}

const FEATURE_META = [
  { key: 'can_comment', label: 'Comment in discussions', description: 'Engagement & plan comments' },
  { key: 'can_be_assigned', label: 'Be assigned to plans', description: 'Work plan assignments' },
  { key: 'can_create_personal_plans', label: 'Create personal plans', description: 'Family / personal calendar entries', perAdmin: true },
  { key: 'can_create_work_plans', label: 'Create work plans', description: 'Coworker / work calendar entries', perAdmin: true },
  { key: 'can_start_chats', label: 'Start conversations', description: 'Create new chat conversations' },
];

function RoleDefaultsCard({ settings, update }) {
  const features = settings?.features || DEFAULT_FEATURES;
  const [saving, setSaving] = useState(false);
  const toggle = async (key, role, value) => {
    setSaving(true);
    try {
      await update({ ...features, [key]: { ...features[key], [role]: value } });
    } finally {
      setSaving(false);
    }
  };
  const toggleSection = async (id, role, value) => {
    setSaving(true);
    try {
      const cur = features.dashboard_sections || {};
      await update({ ...features, dashboard_sections: { ...cur, [id]: { ...cur[id], [role]: value } } });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-4">
      <CollapsibleSection title="Default access by role" icon={ShieldCheck} iconTone="text-primary" defaultOpen>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Defaults apply to anyone you haven't individually toggled. Individual on/off toggles override these for that person.</p>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="mt-3 divide-y divide-border">
          {FEATURE_META.map((f) => {
            const userOn = !!features?.[f.key]?.user;
            const adminOn = !!features?.[f.key]?.admin;
            return (
              <div key={f.key} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground">{f.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Admin</span>
                    <Switch checked={adminOn} onCheckedChange={(v) => toggle(f.key, 'admin', v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Collaborator</span>
                    <Switch checked={userOn} onCheckedChange={(v) => toggle(f.key, 'user', v)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Dashboard visibility by role" icon={LayoutDashboard} iconTone="text-primary">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Choose which Dashboard sections administrators and collaborators can see. You (the Owner) always see everything.</p>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="mt-3 divide-y divide-border">
          {DASHBOARD_SECTIONS.map((s) => {
            const secs = features.dashboard_sections || {};
            const userOn = secs[s.id]?.user !== false;
            const adminOn = secs[s.id]?.admin !== false;
            return (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Admin</span>
                    <Switch checked={adminOn} onCheckedChange={(v) => toggleSection(s.id, 'admin', v)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Collaborator</span>
                    <Switch checked={userOn} onCheckedChange={(v) => toggleSection(s.id, 'user', v)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>
    </div>
  );
}

export default function UserManagement() {
  const { user } = useAuth();
  const isOwnerUser = !!user?.is_owner;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState('');
  const { settings, update } = useAppSettings();

  const matches = (u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  };
  const filtered = users.filter(matches);
  const counts = {
    total: users.length,
    owners: users.filter((u) => u.is_owner).length,
    admins: users.filter((u) => u.role === 'admin' && !u.is_owner).length,
    collaborators: users.filter((u) => u.role === 'user').length,
    canComment: users.filter((u) => resolveFeature(u, settings, 'can_comment')).length,
    canBeAssigned: users.filter((u) => resolveFeature(u, settings, 'can_be_assigned')).length,
    personalPlans: users.filter((u) => resolvePlanFlag(u, settings, 'can_create_personal_plans')).length,
    workPlans: users.filter((u) => resolvePlanFlag(u, settings, 'can_create_work_plans')).length,
  };

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.User.list();
      setUsers(list);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwnerUser) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = async (id, field, value) => {
    setSavingId(id);
    try {
      await base44.entities.User.update(id, { [field]: value });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
    } catch (e) {
      console.error('Failed to update user', e);
    } finally {
      setSavingId(null);
    }
  };

  if (!isOwnerUser) {
    return (
      <main className="min-h-screen bg-background text-foreground pt-safe pb-safe">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">You don’t have access to manage users.</p>
          <Link to="/" className="mt-4 inline-block"><Button variant="outline" className="border-border bg-card">Back to Home</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-9">
        <div className="flex items-center justify-between border-b border-border pb-5">
          <Brand />
          <Link to="/"><Button variant="outline" className="border-border bg-card"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Button></Link>
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold">User permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage everyone's access in one place — see current permissions and toggle commenting or planning for each person.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-muted-foreground"><UsersIcon className="h-4 w-4" /><span className="text-[11px] font-medium">People</span></div>
            <p className="mt-1 font-display text-2xl font-semibold">{counts.total}</p>
            <p className="text-[11px] text-muted-foreground">{counts.owners} owner · {counts.admins} admin · {counts.collaborators} collaborator{counts.collaborators === 1 ? '' : 's'}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-muted-foreground"><MessageSquare className="h-4 w-4" /><span className="text-[11px] font-medium">Can comment</span></div>
            <p className="mt-1 font-display text-2xl font-semibold">{counts.canComment}</p>
            <p className="text-[11px] text-muted-foreground">of {counts.total} people</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-muted-foreground"><UserCheck className="h-4 w-4" /><span className="text-[11px] font-medium">Assignable</span></div>
            <p className="mt-1 font-display text-2xl font-semibold">{counts.canBeAssigned}</p>
            <p className="text-[11px] text-muted-foreground">of {counts.total} people</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /><span className="text-[11px] font-medium">Plan creators</span></div>
            <p className="mt-1 font-display text-2xl font-semibold">{counts.personalPlans + counts.workPlans}</p>
            <p className="text-[11px] text-muted-foreground">{counts.personalPlans} personal · {counts.workPlans} work</p>
          </div>
        </div>

        <RoleDefaultsCard settings={settings} update={update} />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email" className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No users found.</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No people match “{query}”.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => {
              const isSelf = u.id === user?.id;
              const saving = savingId === u.id;
              const adminLocked = u.role === 'admin';
              return (
                <div key={u.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{u.full_name || u.email}{isSelf && ' (you)'}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${u.is_owner ? 'bg-primary text-primary-foreground' : adminLocked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.is_owner ? 'Owner' : adminLocked ? 'Administrator' : 'Collaborator'}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <PermissionToggle
                      icon={<MessageSquare className="h-4 w-4" />}
                      label="Can comment"
                      description="Engagement & plan discussions"
                      checked={resolveFeature(u, settings, 'can_comment')}
                      disabled={isSelf}
                      onCheckedChange={(v) => updateField(u.id, 'can_comment', v)}
                    />
                    <PermissionToggle
                      icon={<UserCheck className="h-4 w-4" />}
                      label="Can be assigned"
                      description="Assignable to work plans"
                      checked={resolveFeature(u, settings, 'can_be_assigned')}
                      disabled={isSelf}
                      onCheckedChange={(v) => updateField(u.id, 'can_be_assigned', v)}
                    />
                    <PermissionToggle
                      icon={<CalendarDays className="h-4 w-4" />}
                      label="Create personal plans"
                      description="Family / personal calendar entries"
                      checked={resolvePlanFlag(u, settings, 'can_create_personal_plans')}
                      disabled={isSelf}
                      onCheckedChange={(v) => updateField(u.id, 'can_create_personal_plans', v)}
                    />
                    <PermissionToggle
                      icon={<Briefcase className="h-4 w-4" />}
                      label="Create work plans"
                      description="Coworker / work calendar entries"
                      checked={resolvePlanFlag(u, settings, 'can_create_work_plans')}
                      disabled={isSelf}
                      onCheckedChange={(v) => updateField(u.id, 'can_create_work_plans', v)}
                    />
                    <PermissionToggle
                      icon={<MessageCircle className="h-4 w-4" />}
                      label="Can start conversations"
                      description="Create new chat conversations"
                      checked={resolveFeature(u, settings, 'can_start_chats')}
                      disabled={isSelf}
                      onCheckedChange={(v) => updateField(u.id, 'can_start_chats', v)}
                    />
                  </div>
                  {!isSelf && (
                    <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Role</span>
                      <div className="w-44">
                        <ResponsiveSelect
                          value={u.role}
                          onValueChange={(v) => updateField(u.id, 'role', v)}
                          options={[{ value: 'user', label: 'Collaborator' }, { value: 'admin', label: 'Administrator' }]}
                          triggerClassName="border-border text-xs h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="h-16 lg:hidden" />
    </main>
  );
}