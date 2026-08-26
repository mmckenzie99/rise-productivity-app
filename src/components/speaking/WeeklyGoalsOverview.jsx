import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Check, ChevronLeft, ChevronRight, CalendarClock, Bell } from 'lucide-react';
import { weekStartKey, focusOf } from './WeeklyGoals';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FOCUSES = ['Faith Goal', 'Fitness Goal', 'Duty Goal'];
const FOCUS_DOT = {
  'Faith Goal': '#D9A404',
  'Fitness Goal': '#166534',
  'Duty Goal': '#1B2A4B',
};
const FOCUS_TONE = {
  'Faith Goal': 'bg-[#FBF0D0]/70 text-[#8A6D0B] border-[#D9A404]/30',
  'Fitness Goal': 'bg-[#DCFCE7] text-[#166534] border-[#166534]/25',
  'Duty Goal': 'bg-[#E2E8F0] text-[#1B2A4B] border-[#1B2A4B]/20',
};

const addDays = (key, n) => {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtRange = (startKey) => {
  const s = new Date(startKey + 'T00:00:00');
  const e = new Date(addDays(startKey, 6) + 'T00:00:00');
  const sameMonth = s.getMonth() === e.getMonth();
  const sLabel = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const eLabel = sameMonth
    ? e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${sLabel} – ${eLabel}`;
};

export default function WeeklyGoalsOverview() {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0); // weeks from current week
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const startKey = weekStartKey(new Date(Date.now() + offset * 7 * 24 * 60 * 60 * 1000));
  const isCurrent = offset === 0;

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.WeeklyGoal.filter({ start_date: startKey })
      .then((res) => {
        if (!active) return;
        setRecord(res && res[0] ? res[0] : null);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [startKey]);

  const goals = Array.isArray(record?.goals) ? record.goals : [];
  const done = goals.filter((g) => g.completed).length;
  const pct = goals.length > 0 ? Math.round((done / goals.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Previous week"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-sm font-medium text-foreground">
            {fmtRange(startKey)}
            {isCurrent && <span className="ml-1.5 text-[11px] font-normal text-primary">· This week</span>}
          </div>
          {goals.length > 0 && (
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 text-primary" />
              {done}/{goals.length} done
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 1)}
          aria-label="Next week"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <p className="py-3 text-sm text-muted-foreground">Loading weekly goals…</p>
      ) : goals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
          No goals set for this week.
        </p>
      ) : (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => {
              const tags = focusOf(g);
              const primary = tags[0] || 'Personal';
              const tone = FOCUS_TONE[primary] || 'bg-muted text-muted-foreground border-border';
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelected(g)}
                  className={`group flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:shadow-sm ${tone} ${g.completed ? 'opacity-60' : ''}`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${g.completed ? 'border-current bg-current text-primary-foreground' : 'border-current/40'}`}
                  >
                    {g.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </span>
                  <span className={`max-w-[180px] truncate ${g.completed ? 'line-through' : ''}`}>{g.text}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Quick-look dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-semibold text-foreground">Goal quick look</DialogTitle>
            <p className="text-[11px] text-muted-foreground">{fmtRange(startKey)}</p>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <p className={`text-sm text-foreground ${selected.completed ? 'line-through opacity-70' : ''}`}>{selected.text}</p>
              <div className="flex flex-wrap gap-1.5">
                {focusOf(selected).map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                    style={{ borderColor: `${FOCUS_DOT[t] || '#94A3B8'}40`, color: FOCUS_DOT[t] || '#64748B', background: `${FOCUS_DOT[t] || '#94A3B8'}12` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: FOCUS_DOT[t] || '#94A3B8' }} />
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${selected.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                  {selected.completed ? 'Completed' : 'Not completed'}
                </span>
                {selected.reminder_time && (
                  <span className="flex items-center gap-1">
                    <Bell className="h-3 w-3 text-primary" />
                    Daily {selected.reminder_time}
                  </span>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
            <Button
              size="sm"
              onClick={() => {
                setSelected(null);
                navigate(`/calendar?date=${startKey}`);
              }}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Open in Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}