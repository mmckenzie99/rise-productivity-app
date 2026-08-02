import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';
import { Target } from 'lucide-react';

// Returns the Sunday (week start) date key for a given Date
const weekStartKey = (d) => {
  const sun = new Date(d);
  sun.setDate(sun.getDate() - sun.getDay());
  return `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;
};

export default function WeeklyGoals({ cursor }) {
  const startKey = weekStartKey(cursor);
  const [record, setRecord] = useState(null);
  const [goals, setGoals] = useState('');
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
        setGoals(rec?.goals || '');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [startKey]);

  const persist = (value) => {
    if (record?.id) {
      base44.entities.WeeklyGoal.update(record.id, { goals: value }).then(setRecord);
    } else {
      base44.entities.WeeklyGoal.create({ start_date: startKey, goals: value }).then(setRecord);
    }
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (loading) return;
    timer.current = setTimeout(() => {
      if (goals !== (record?.goals || '')) persist(goals);
    }, 700);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, loading]);

  if (loading) {
    return <div className="rounded-md border border-[#D6DAE3] bg-white p-3 text-sm text-[#5A6781]">Loading weekly goals…</div>;
  }

  return (
    <div className="rounded-md border border-[#D6DAE3] bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[#1B2A4B]">
        <Target className="h-3.5 w-3.5 text-[#D9A404]" />
        <span className="text-xs font-semibold uppercase tracking-wider">Goals for the Week</span>
      </div>
      <Textarea
        value={goals}
        onChange={(e) => setGoals(e.target.value)}
        rows={3}
        placeholder="What do you want to accomplish this week?"
        className="border-[#D6DAE3]"
      />
    </div>
  );
}