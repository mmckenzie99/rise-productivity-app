import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Target, Plus, Trash2, Check, Bell } from 'lucide-react';
import ResponsiveSelect from './ResponsiveSelect';

const FOCUSES = ['Spiritual', 'Professional', 'Physical', 'Mental', 'Relational', 'Personal'];

const FOCUS_TONES = {
  Spiritual: 'bg-[#FBF0D0]/60 text-[#8A6D0B]',
  Professional: 'bg-[#E2E8F0] text-[#1B2A4B]',
  Physical: 'bg-[#DCFCE7] text-[#166534]',
  Mental: 'bg-[#E9D5FF] text-[#6B21A8]',
  Relational: 'bg-[#FFE4E6] text-[#9F1239]',
  Personal: 'bg-[#F0F2F6] text-[#5A6781]',
};

const weekStartKey = (d) => {
  const sun = new Date(d);
  sun.setDate(sun.getDate() - sun.getDay());
  return `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;
};

const newId = () => Math.random().toString(36).slice(2, 10);

export default function WeeklyGoals({ cursor }) {
  const startKey = weekStartKey(cursor);
  const [record, setRecord] = useState(null);
  const [goals, setGoals] = useState([]);
  const [draftText, setDraftText] = useState('');
  const [draftFocus, setDraftFocus] = useState(FOCUSES[0]);
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

  const addGoal = () => {
    if (!draftText.trim()) return;
    setGoals((g) => [...g, { id: newId(), text: draftText.trim(), focus: draftFocus, completed: false }]);
    setDraftText('');
  };

  const toggleComplete = (id) => {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)));
  };

  const removeGoal = (id) => {
    setGoals((g) => g.filter((x) => x.id !== id));
  };

  const saveReminder = (val) => {
    setReminderTime(val);
    // Trigger the debounced autosave effect (which now persists reminder + goals together).
  };

  if (loading) {
    return <div className="rounded-md border border-[#D6DAE3] bg-white p-3 text-sm text-[#5A6781]">Loading weekly goals…</div>;
  }

  const grouped = FOCUSES.filter((f) => goals.some((g) => g.focus === f)).map((f) => ({
    focus: f,
    items: goals.filter((g) => g.focus === f),
  }));

  return (
    <div className="rounded-md border border-[#D6DAE3] bg-white p-3">
      <div className="mb-3 flex items-center gap-1.5 text-[#1B2A4B]">
        <Target className="h-3.5 w-3.5 text-[#D9A404]" />
        <span className="text-xs font-semibold uppercase tracking-wider">Goals for the Week</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-[#D9A404]" />
          <span className="text-[11px] text-[#5A6781]">Reminder</span>
          <Input
            type="time"
            value={reminderTime}
            onChange={(e) => saveReminder(e.target.value)}
            className="h-8 w-[110px] border-[#D6DAE3] text-xs"
          />
        </div>
      </div>

      {/* Add a goal */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); }}
          placeholder="Add a goal…"
          className="h-8 flex-1 min-w-[160px] border-[#D6DAE3] text-sm"
        />
        <ResponsiveSelect
          value={draftFocus}
          onValueChange={setDraftFocus}
          options={FOCUSES.map((f) => ({ value: f, label: f }))}
          triggerClassName="h-8 w-[140px] border-[#D6DAE3] text-xs"
        />
        <Button size="sm" onClick={addGoal} disabled={!draftText.trim()} className="h-8">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {/* Grouped goals */}
      {grouped.length === 0 ? (
        <p className="py-3 text-center text-xs text-[#5A6781]">No goals yet — add one above to focus your week.</p>
      ) : (
        <div className="space-y-3">
          {grouped.map((grp) => (
            <div key={grp.focus}>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5A6781]">{grp.focus}</div>
              <div className="space-y-1.5">
                {grp.items.map((g) => {
                  const tone = FOCUS_TONES[g.focus] || 'bg-[#F0F2F6] text-[#5A6781]';
                  return (
                    <div key={g.id} className="flex items-center gap-2 rounded-md border border-[#EDEFF4] bg-white px-2 py-1.5">
                      <button
                        onClick={() => toggleComplete(g.id)}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${g.completed ? 'border-[#D9A404] bg-[#D9A404] text-white' : 'border-[#D6DAE3] text-transparent'}`}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </button>
                      <span className={`flex-1 text-sm ${g.completed ? 'text-[#9CA3AF] line-through' : 'text-[#1B2A4B]'}`}>
                        {g.text}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>{g.focus}</span>
                      <button
                        onClick={() => removeGoal(g.id)}
                        className="shrink-0 text-[#9CA3AF] transition hover:text-[#B91C1C]"
                        title="Remove goal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}