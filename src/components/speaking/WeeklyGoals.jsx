import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Target, Plus, Trash2, Check, Bell } from 'lucide-react';

const FOCUSES = ['Spiritual', 'Professional', 'Physical', 'Mental', 'Relational', 'Personal'];
const MAX_GOALS = 4;

const FOCUS_TONES = {
  Spiritual: 'bg-[#FBF0D0]/60 text-[#8A6D0B]',
  Professional: 'bg-[#E2E8F0] text-[#1B2A4B]',
  Physical: 'bg-[#DCFCE7] text-[#166534]',
  Mental: 'bg-[#E9D5FF] text-[#6B21A8]',
  Relational: 'bg-[#FFE4E6] text-[#9F1239]',
  Personal: 'bg-muted text-muted-foreground',
};

export const weekStartKey = (d) => {
  const sun = new Date(d);
  sun.setDate(sun.getDate() - sun.getDay());
  return `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;
};

const newId = () => Math.random().toString(36).slice(2, 10);
export const focusOf = (g) => (Array.isArray(g.focus) ? g.focus : g.focus ? [g.focus] : ['Personal']);

export default function WeeklyGoals({ cursor }) {
  const startKey = weekStartKey(cursor);
  const [record, setRecord] = useState(null);
  const [goals, setGoals] = useState([]);
  const [draftText, setDraftText] = useState('');
  const [draftFocuses, setDraftFocuses] = useState([]);
  const [reminderTime, setReminderTime] = useState('');
  const [userTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Detroit');
  const timer = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.WeeklyGoal.filter({ start_date: startKey })
      .then((res) => {
        if (!active) return;
        const rec = res && res[0];
        setRecord(rec || null);
        setGoals(Array.isArray(rec?.goals) ? rec.goals : []);
        setReminderTime(rec?.goal_reminder_time || '');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [startKey]);

  const persist = (next) => {
    const payload = { goals: next, goal_reminder_time: reminderTime || null, reminder_timezone: userTz };
    if (record?.id) {
      base44.entities.WeeklyGoal.update(record.id, payload).then(setRecord);
    } else {
      base44.entities.WeeklyGoal.create({ start_date: startKey, ...payload }).then(setRecord);
    }
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (loading) return;
    timer.current = setTimeout(() => {
      persist(goals);
    }, 500);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, reminderTime, loading]);

  const atCapacity = goals.length >= MAX_GOALS;

  const addGoal = () => {
    if (!draftText.trim() || atCapacity) return;
    const focus = draftFocuses.length > 0 ? draftFocuses : ['Personal'];
    setGoals((g) => [...g, { id: newId(), text: draftText.trim(), focus, completed: false }]);
    setDraftText('');
    setDraftFocuses([]);
  };

  const toggleDraftFocus = (f) => {
    setDraftFocuses((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  };

  const selectAllFocuses = () => {
    setDraftFocuses((cur) => (cur.length === FOCUSES.length ? [] : [...FOCUSES]));
  };

  const toggleComplete = (id) => {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)));
  };

  const removeGoal = (id) => {
    setGoals((g) => g.filter((x) => x.id !== id));
  };

  if (loading) {
    return <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">Loading weekly goals…</div>;
  }

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5 text-foreground">
        <Target className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider">Goals for the Week</span>
        <span className="text-[11px] text-muted-foreground">{goals.length}/{MAX_GOALS}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-primary" />
          <Input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="h-8 w-[110px] border-border text-xs"
          />
        </div>
      </div>

      {/* Add a goal */}
      {!atCapacity && (
        <div className="mb-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <Input
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); }}
              placeholder="Add a goal…"
              className="h-8 flex-1 min-w-[120px] border-border text-sm"
            />
            <Button size="sm" onClick={addGoal} disabled={!draftText.trim()} className="h-8 shrink-0 px-2.5">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={selectAllFocuses}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                draftFocuses.length === FOCUSES.length
                  ? 'bg-foreground text-primary-foreground border-transparent'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            {FOCUSES.map((f) => {
              const on = draftFocuses.includes(f);
              const tone = FOCUS_TONES[f] || 'bg-muted text-muted-foreground';
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleDraftFocus(f)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                    on ? `${tone} border-transparent` : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Flat goal list */}
      {goals.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">No goals yet — add up to {MAX_GOALS} above.</p>
      ) : (
        <div className="space-y-1.5">
          {goals.map((g) => {
            const tags = focusOf(g);
            return (
              <div key={g.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
                <button
                  onClick={() => toggleComplete(g.id)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${g.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'}`}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </button>
                <span className={`flex-1 truncate text-sm ${g.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {g.text}
                </span>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {tags.map((t) => (
                    <span key={t} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${FOCUS_TONES[t] || 'bg-muted text-muted-foreground'}`}>{t}</span>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Bell className={`h-3.5 w-3.5 ${g.reminder_time ? 'text-primary' : 'text-muted'}`} />
                  <Input
                    type="time"
                    value={g.reminder_time || ''}
                    onChange={(e) => setGoals((cur) => cur.map((x) => (x.id === g.id ? { ...x, reminder_time: e.target.value || '' } : x)))}
                    className="h-7 w-[100px] border-border text-xs"
                    title="Daily reminder time for this goal"
                  />
                </div>
                <button
                  onClick={() => removeGoal(g.id)}
                  className="shrink-0 text-muted-foreground transition hover:text-destructive"
                  title="Remove goal"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}