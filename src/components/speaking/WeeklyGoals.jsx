import { useEffect, useRef, useState } from 'react';
import { data } from '@/lib/workspaceData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import TimePicker from '@/components/speaking/TimePicker';
import AddButton from '@/components/speaking/AddButton';
import { Target, Trash2, Check, Bell, ChevronDown } from 'lucide-react';

const GOAL_TYPES = ['Faith Goal', 'Fitness Goal', 'Duty Goal'];
const MAX_GOALS = 4;

const GOAL_TYPE_TONES = {
  'Faith Goal': 'bg-[#FBF0D0]/60 text-[#8A6D0B]',
  'Fitness Goal': 'bg-[#DCFCE7] text-[#166534]',
  'Duty Goal': 'bg-[#E2E8F0] text-[#1B2A4B]',
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
  const [draftType, setDraftType] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [userTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Detroit');
  const timer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    data.entities.WeeklyGoal.filter({ start_date: startKey })
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
      data.entities.WeeklyGoal.update(record.id, payload).then(setRecord);
    } else {
      data.entities.WeeklyGoal.create({ start_date: startKey, ...payload }).then(setRecord);
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
    if (!draftText.trim() || !draftType || atCapacity) return;
    setGoals((g) => [...g, { id: newId(), text: draftText.trim(), focus: [draftType], completed: false }]);
    setDraftText('');
    setDraftType('');
  };

  const toggleComplete = (id) => {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)));
  };

  const removeGoal = (id) => {
    setGoals((g) => g.filter((x) => x.id !== id));
  };

  const allSelected = goals.length > 0 && selected.size === goals.length;
  const toggleSelect = (id) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllGoals = () => setSelected(allSelected ? new Set() : new Set(goals.map((g) => g.id)));
  const exitSelect = () => { setSelectMode(false); setSelected(new Set()); };
  const bulkComplete = () => {
    setGoals((g) => g.map((x) => (selected.has(x.id) ? { ...x, completed: true } : x)));
    setSelected(new Set());
  };
  const bulkDelete = () => {
    setGoals((g) => g.filter((x) => !selected.has(x.id)));
    setSelected(new Set());
  };

  if (loading) {
    return <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">Loading weekly goals…</div>;
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-1.5 p-3 text-left text-foreground"
      >
        <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider">Goals for the Week</span>
        <span className="text-[11px] text-muted-foreground">{goals.length}/{MAX_GOALS}</span>
        <ChevronDown className={`ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center justify-end gap-1.5">
          {goals.length > 0 && (
            <button
              type="button"
              onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                selectMode ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {selectMode ? 'Done' : 'Select'}
            </button>
          )}
          {selectMode && goals.length > 0 && (
            <button
              type="button"
              onClick={selectAllGoals}
              className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:bg-muted"
            >
              {allSelected ? 'Clear' : 'All'}
            </button>
          )}
          <Bell className="h-3.5 w-3.5 text-primary" />
          <TimePicker
            value={reminderTime}
            onChange={(v) => setReminderTime(v)}
            className="h-8 w-[110px] border-border text-xs"
            label="Weekly reminder"
          />
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
            <AddButton onClick={addGoal} disabled={!draftText.trim() || !draftType} label="Add goal" className="h-8 px-2" iconClass="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-wrap gap-1">
            {GOAL_TYPES.map((t) => {
              const on = draftType === t;
              const tone = GOAL_TYPE_TONES[t] || 'bg-muted text-muted-foreground';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraftType(t)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                    on ? `${tone} border-transparent` : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t}
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
              <div key={g.id} className={`flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 ${selectMode && selected.has(g.id) ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
                {selectMode && (
                  <button
                    onClick={() => toggleSelect(g.id)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected.has(g.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}
                  >
                    {selected.has(g.id) && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </button>
                )}
                {!selectMode && (
                  <button
                    onClick={() => toggleComplete(g.id)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${g.completed ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'}`}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </button>
                )}
                <span className={`flex-1 truncate text-sm ${g.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {g.text}
                </span>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {tags.map((t) => (
                    <span key={t} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${GOAL_TYPE_TONES[t] || 'bg-muted text-muted-foreground'}`}>{t}</span>
                  ))}
                </div>
                {!selectMode && (
                  <>
                    <div className="flex shrink-0 items-center gap-1">
                      <Bell className={`h-3.5 w-3.5 ${g.reminder_time ? 'text-primary' : 'text-muted'}`} />
                      <TimePicker
                        value={g.reminder_time || ''}
                        onChange={(v) => setGoals((cur) => cur.map((x) => (x.id === g.id ? { ...x, reminder_time: v || '' } : x)))}
                        className="h-7 w-[100px] border-border text-xs"
                        label="Daily reminder time"
                      />
                    </div>
                    <button
                      onClick={() => removeGoal(g.id)}
                      className="shrink-0 text-muted-foreground transition hover:text-destructive"
                      title="Remove goal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectMode && selected.size > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-card p-2 shadow-sm">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={bulkComplete} className="h-8 gap-1.5">
              <Check className="h-3.5 w-3.5" />Mark complete
            </Button>
            <Button size="sm" variant="outline" onClick={bulkDelete} className="h-8 gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />Delete
            </Button>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}