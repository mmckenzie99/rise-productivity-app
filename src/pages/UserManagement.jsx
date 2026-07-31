import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, UserCheck, ShieldCheck, ArrowLeft, CalendarDays, Briefcase } from 'lucide-react';
import Brand from '@/components/speaking/Brand';
import BottomTabBar from '@/components/speaking/BottomTabBar';
import ResponsiveSelect from '@/components/speaking/ResponsiveSelect';
import { useAppSettings, DEFAULT_FEATURES } from '@/hooks/useAppSettings';
import { resolveFeature, resolvePlanFlag } from '@/lib/permissions';

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
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Default access by role</h2>
          <p className="text-xs text-muted-foreground">Defaults applied to each role. Turn an admin default off to assign that feature to specific administrators individually.</p>
        </div>
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
    </div>
  );
}

export default function UserManagement() {
  const { user } = useAuth();
  const isOwnerUser = !!user?.is_owner;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const { settings, update } = useAppSettings();

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
          <p className="mt-1 text-sm text-muted-foreground">Turn features on or off for each person. Turn a role default off to restrict or assign access per administrator.</p>
        </div>
        <RoleDefaultsCard settings={settings} update={update} />

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
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
                      description={settings?.features?.can_comment?.[u.role] ? 'Turn off the role default to assign individually' : 'Engagement & plan discussions'}
                      checked={resolveFeature(u, settings, 'can_comment')}
                      disabled={!!settings?.features?.can_comment?.[u.role]}
                      onCheckedChange={(v) => updateField(u.id, 'can_comment', v)}
                    />
                    <PermissionToggle
                      icon={<UserCheck className="h-4 w-4" />}
                      label="Can be assigned"
                      description={settings?.features?.can_be_assigned?.[u.role] ? 'Turn off the role default to assign individually' : 'Assignable to work plans'}
                      checked={resolveFeature(u, settings, 'can_be_assigned')}
                      disabled={!!settings?.features?.can_be_assigned?.[u.role]}
                      onCheckedChange={(v) => updateField(u.id, 'can_be_assigned', v)}
                    />
                    <PermissionToggle
                      icon={<CalendarDays className="h-4 w-4" />}
                      label="Create personal plans"
                      description={settings?.features?.can_create_personal_plans?.[u.role] ? 'Turn off the role default to assign individually' : 'Family / personal calendar entries'}
                      checked={resolvePlanFlag(u, settings, 'can_create_personal_plans')}
                      disabled={!!settings?.features?.can_create_personal_plans?.[u.role]}
                      onCheckedChange={(v) => updateField(u.id, 'can_create_personal_plans', v)}
                    />
                    <PermissionToggle
                      icon={<Briefcase className="h-4 w-4" />}
                      label="Create work plans"
                      description={settings?.features?.can_create_work_plans?.[u.role] ? 'Turn off the role default to assign individually' : 'Coworker / work calendar entries'}
                      checked={resolvePlanFlag(u, settings, 'can_create_work_plans')}
                      disabled={!!settings?.features?.can_create_work_plans?.[u.role]}
                      onCheckedChange={(v) => updateField(u.id, 'can_create_work_plans', v)}
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
      <BottomTabBar />
    </main>
  );
}