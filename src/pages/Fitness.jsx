import { useMemo, useState } from 'react';
import { Plus, Star, Trash2, Dumbbell, Moon, Scale, Target, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import useFitness from '@/hooks/useFitness';
import DatePicker from '@/components/speaking/DatePicker';
import ResponsiveSelect from '@/components/speaking/ResponsiveSelect';
import FileUploadButton from '@/components/speaking/FileUploadButton';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import PageHeader from '@/components/speaking/PageHeader';
import { Image } from '@/components/ui/image';
import { formatDate } from '@/lib/speaking';
import ImportantFlagButton from '@/components/speaking/ImportantFlagButton';
import { Switch } from '@/components/ui/switch';
import { syncFollowUpFlag } from '@/lib/followUpFlag';
import { useImportantFlags } from '@/lib/ImportantFlagsProvider';

const ACTIVITIES = ['Run', 'Walk', 'Strength', 'Cycling', 'Swim', 'Yoga', 'Sports', 'Other'];
const INTENSITIES = ['Easy', 'Moderate', 'Hard'];
const GOAL_METRICS = ['Workouts per week', 'Sleep score avg', 'Weight target', 'Distance per week'];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const num = (v) => (v === '' || v == null ? null : Number(v));

const blankForm = () => ({
  date: todayStr(), activity: 'Run', duration_minutes: '', distance_miles: '',
  intensity: 'Moderate', calories: '', sleep_hours: '', sleep_score: '',
  weight: '', notes: '', photo_url: '', is_favorite: false,
});

export default function Fitness() {
  const { items, loading, save, remove, load } = useFitness();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [showGoal, setShowGoal] = useState(false);
  const [goal, setGoal] = useState({ goal_metric: 'Workouts per week', goal_target: '', goal_deadline: '' });
  const [favOnly, setFavOnly] = useState(false);
  const [flagForFollowUp, setFlagForFollowUp] = useState(false);
  const { flaggedKeys, toggle, load: loadFlags } = useImportantFlags();

  const logs = useMemo(() => items.filter((i) => i.kind !== 'goal'), [items]);
  const goals = useMemo(() => items.filter((i) => i.kind === 'goal'), [items]);

  const latestWeight = useMemo(() => logs.find((l) => l.weight != null)?.weight, [logs]);
  const ws = weekStart();
  const workoutsThisWeek = useMemo(() => logs.filter((l) => l.date && l.date >= ws && l.activity).length, [logs, ws]);
  const avgSleep = useMemo(() => {
    const recent = logs.filter((l) => l.sleep_score != null && l.date && l.date >= ws);
    if (!recent.length) return null;
    return Math.round(recent.reduce((s, l) => s + l.sleep_score, 0) / recent.length);
  }, [logs, ws]);

  const visibleLogs = favOnly ? logs.filter((l) => l.is_favorite) : logs;

  const submit = async () => {
    const saved = await save({
      kind: 'log', date: form.date, activity: form.activity,
      duration_minutes: num(form.duration_minutes), distance_miles: num(form.distance_miles),
      intensity: form.intensity, calories: num(form.calories),
      sleep_hours: num(form.sleep_hours), sleep_score: num(form.sleep_score),
      weight: num(form.weight), notes: form.notes, photo_url: form.photo_url, is_favorite: form.is_favorite,
    });
    if (saved?.id) {
      await syncFollowUpFlag('Fitness', saved.id, flagForFollowUp, `${form.activity || 'Workout'} — ${formatDate(form.date)}`, form.date);
      await loadFlags();
    }
    setForm(blankForm());
    setFlagForFollowUp(false);
    setShowForm(false);
  };

  const submitGoal = async () => {
    if (!goal.goal_target) return;
    await save({ kind: 'goal', date: todayStr(), goal_metric: goal.goal_metric, goal_target: num(goal.goal_target), goal_deadline: goal.goal_deadline || null, goal_completed: false });
    setGoal({ goal_metric: 'Workouts per week', goal_target: '', goal_deadline: '' });
    setShowGoal(false);
  };

  const toggleFav = async (l) => { await save({ ...l, is_favorite: !l.is_favorite }); };
  const toggleGoalDone = async (g) => { await save({ ...g, goal_completed: !g.goal_completed }); };

  return (
    <main className="min-h-screen bg-background text-foreground pb-safe">
      <PageHeader title="Fitness" backTo="/" actions={
        <button onClick={() => { setFlagForFollowUp(false); setShowForm(true); setShowGoal(false); }} className="inline-flex items-center gap-1.5 rounded-md bg-[#D9A404] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#B89003]">
          <Plus className="h-4 w-4" />Log
        </button>
      } />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-9">
        <PullToRefresh onRefresh={load}>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <Scale className="h-4 w-4 text-primary" />
            <div className="mt-1 text-xl font-semibold">{latestWeight ?? '—'}<span className="ml-1 text-xs text-muted-foreground">lbs</span></div>
            <div className="text-[11px] text-muted-foreground">Latest weight</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <Moon className="h-4 w-4 text-primary" />
            <div className="mt-1 text-xl font-semibold">{avgSleep ?? '—'}</div>
            <div className="text-[11px] text-muted-foreground">Avg sleep score (7d)</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <Dumbbell className="h-4 w-4 text-primary" />
            <div className="mt-1 text-xl font-semibold">{workoutsThisWeek}</div>
            <div className="text-[11px] text-muted-foreground">Workouts this week</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Target className="h-4 w-4 text-primary" />Goals</h2>
            <button onClick={() => { setShowGoal(true); setShowForm(false); }} className="text-xs font-medium text-primary hover:underline">+ Add goal</button>
          </div>
          {goals.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card/60 py-6 text-center text-sm text-muted-foreground">No fitness goals yet.</p>
          ) : (
            <div className="space-y-2">
              {goals.map((g) => (
                <div key={g.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <button onClick={() => toggleGoalDone(g)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${g.goal_completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                    {g.goal_completed && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${g.goal_completed ? 'text-muted-foreground line-through' : ''}`}>{g.goal_metric}: {g.goal_target}</p>
                    {g.goal_deadline && <p className="text-xs text-muted-foreground">by {formatDate(g.goal_deadline)}</p>}
                  </div>
                  <button onClick={() => remove(g.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Dumbbell className="h-4 w-4 text-primary" />Workout &amp; Health Logs</h2>
            <button onClick={() => setFavOnly((v) => !v)} className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${favOnly ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'}`}>
              ★ Favorites
            </button>
          </div>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : visibleLogs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card/60 py-6 text-center text-sm text-muted-foreground">{favOnly ? 'No favorite workouts yet.' : 'No logs yet — tap Log to add one.'}</p>
          ) : (
            <div className="space-y-2">
              {visibleLogs.map((l) => (
                <div key={l.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{formatDate(l.date)}</span>
                        {l.activity && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{l.activity}</span>}
                        {l.intensity && <span className="text-[11px] text-muted-foreground">{l.intensity}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {l.duration_minutes != null && <span>{l.duration_minutes} min</span>}
                        {l.distance_miles != null && <span>{l.distance_miles} mi</span>}
                        {l.calories != null && <span>{l.calories} cal</span>}
                        {l.sleep_hours != null && <span>Sleep {l.sleep_hours}h</span>}
                        {l.sleep_score != null && <span>Score {l.sleep_score}</span>}
                        {l.weight != null && <span>Weight {l.weight} lbs</span>}
                      </div>
                      {l.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">{l.notes}</p>}
                    </div>
                    <ImportantFlagButton flagged={flaggedKeys.has(`Fitness:${l.id}`)} onToggle={() => toggle('Fitness', l.id, `${l.activity || 'Workout'} — ${formatDate(l.date)}`)} />
                    <button onClick={() => toggleFav(l)} className="shrink-0" aria-label="Favorite">
                      <Star className={`h-4 w-4 ${l.is_favorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                    </button>
                    <button onClick={() => remove(l.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {l.photo_url && (
                    <div className="mt-2 overflow-hidden rounded-md">
                      <Image src={l.photo_url} alt="Fitness photo" className="h-40 w-full" fittingType="fill" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-28 lg:hidden" />
        </PullToRefresh>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-lg border border-border bg-card p-4 pb-safe sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-display text-lg font-semibold">Log workout / health</h3>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto">
              <div className="space-y-1"><Label>Date</Label><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} label="Date" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Activity</Label><ResponsiveSelect value={form.activity} onValueChange={(v) => setForm({ ...form, activity: v })} options={ACTIVITIES.map((a) => ({ value: a, label: a }))} label="Activity" /></div>
                <div className="space-y-1"><Label>Intensity</Label><ResponsiveSelect value={form.intensity} onValueChange={(v) => setForm({ ...form, intensity: v })} options={INTENSITIES.map((a) => ({ value: a, label: a }))} label="Intensity" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
                <div className="space-y-1"><Label>Distance (mi)</Label><Input type="number" value={form.distance_miles} onChange={(e) => setForm({ ...form, distance_miles: e.target.value })} /></div>
                <div className="space-y-1"><Label>Calories</Label><Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></div>
                <div className="space-y-1"><Label>Weight (lbs)</Label><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
                <div className="space-y-1"><Label>Sleep (hrs)</Label><Input type="number" value={form.sleep_hours} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} /></div>
                <div className="space-y-1"><Label>Sleep score (0-100)</Label><Input type="number" value={form.sleep_score} onChange={(e) => setForm({ ...form, sleep_score: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="space-y-1">
                <Label>Photo</Label>
                <FileUploadButton label="Add photo" file={{ url: form.photo_url, name: form.photo_url ? 'photo' : '' }} onUpload={(f) => setForm({ ...form, photo_url: f.url })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_favorite} onChange={(e) => setForm({ ...form, is_favorite: e.target.checked })} />
                Save as favorite (reusable workout)
              </label>
              <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div>
                  <Label>Flag for follow-up</Label>
                  <p className="text-[11px] text-muted-foreground">Pins this workout in the Inbox for follow-up.</p>
                </div>
                <Switch checked={flagForFollowUp} onCheckedChange={setFlagForFollowUp} />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1" onClick={submit}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {showGoal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" onClick={() => setShowGoal(false)}>
          <div className="w-full max-w-md rounded-t-lg border border-border bg-card p-4 pb-safe sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-display text-lg font-semibold">New fitness goal</h3>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Metric</Label><ResponsiveSelect value={goal.goal_metric} onValueChange={(v) => setGoal({ ...goal, goal_metric: v })} options={GOAL_METRICS.map((a) => ({ value: a, label: a }))} label="Metric" /></div>
              <div className="space-y-1"><Label>Target</Label><Input type="number" value={goal.goal_target} onChange={(e) => setGoal({ ...goal, goal_target: e.target.value })} /></div>
              <div className="space-y-1"><Label>Deadline</Label><DatePicker value={goal.goal_deadline} onChange={(v) => setGoal({ ...goal, goal_deadline: v })} label="Deadline" /></div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowGoal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={submitGoal}>Save goal</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}