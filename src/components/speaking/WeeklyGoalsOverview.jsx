import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check } from 'lucide-react';
import { weekStartKey, focusOf } from './WeeklyGoals';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FOCUSES = ['Faith Goal', 'Fitness Goal', 'Duty Goal'];
const FOCUS_DOT = {
  'Faith Goal': '#D9A404',
  'Fitness Goal': '#166534',
  'Duty Goal': '#1B2A4B',
};

const fmtWeek = (key) => {
  const d = new Date(key + 'T00:00:00');
  return `${WEEKDAYS[d.getDay()]} ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

export default function WeeklyGoalsOverview() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const now = new Date();
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i * 7);
      weeks.push(weekStartKey(d));
    }
    base44.entities.WeeklyGoal.filter({ start_date: { $in: weeks } })
      .then((res) => {
        if (!active) return;
        const map = {};
        (res || []).forEach((r) => { if (r.start_date) map[r.start_date] = r; });
        setRows(weeks.map((k) => {
          const goals = Array.isArray(map[k]?.goals) ? map[k].goals : [];
          const done = goals.filter((g) => g.completed).length;
          const focusCounts = {};
          goals.forEach((g) => focusOf(g).forEach((f) => { focusCounts[f] = (focusCounts[f] || 0) + 1; }));
          return { key: k, label: fmtWeek(k), total: goals.length, done, focusCounts };
        }));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) {
    return <p className="py-4 text-sm text-muted-foreground">Loading weekly goals…</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
        const isCurrent = r.key === weekStartKey(new Date());
        return (
          <div key={r.key} className={`rounded-xl border p-3.5 ${isCurrent ? 'border-[#D9A404] bg-[#FBF0D0]/30 ring-1 ring-[#D9A404]/30' : 'border-border bg-background/50'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isCurrent ? 'text-[#D9A404]' : 'text-foreground'}`}>
                {r.label}{isCurrent && ' · This week'}
              </span>
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-[#D9A404]" />
                {r.done}/{r.total}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#D9A404] transition-all" style={{ width: `${pct}%` }} />
            </div>
            {r.total === 0 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">No goals set.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FOCUSES.filter((f) => r.focusCounts[f]).map((f) => (
                  <span key={f} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: FOCUS_DOT[f] }} />
                    {f} ({r.focusCounts[f]})
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}