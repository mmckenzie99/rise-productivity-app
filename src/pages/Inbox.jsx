import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import useEngagements from '@/hooks/useEngagements';
import useTasks from '@/hooks/useTasks';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import PageHeader from '@/components/speaking/PageHeader';
import { formatDate } from '@/lib/speaking';

// Repurposed Inbox — a secondary "what needs my attention" screen with two
// sections: Important items (active, not-yet-completed engagements) and
// Follow-up Tasks (outstanding tasks). The old message-paste capture framing
// is gone.
const STATUS_TONE = {
  Planning: 'bg-[#FBF0D0] text-primary',
  Confirmed: 'bg-[#E7EEF6] text-foreground',
  Completed: 'bg-muted text-muted-foreground',
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Inbox() {
  const navigate = useNavigate();
  const { items: engagements, loading: engLoading, load: loadEng } = useEngagements();
  const { items: tasks, loading: taskLoading, toggle, load: loadTasks } = useTasks();

  // Important items: engagements still in Planning or Confirmed (not Completed),
  // sorted by nearest deploy/speaking date.
  const important = useMemo(() => {
    const active = engagements.filter((e) => e.status !== 'Completed');
    return active.sort((a, b) => {
      const da = a.deploy_date || a.speaking_date || a.start_date || '';
      const db = b.deploy_date || b.speaking_date || b.start_date || '';
      return da.localeCompare(db);
    });
  }, [engagements]);

  // Follow-up Tasks: not done, sorted by due date (overdue first, undated last).
  const followups = useMemo(() => {
    const open = tasks.filter((t) => !t.is_done);
    return open.sort((a, b) => {
      const da = a.due_date ? a.due_date.slice(0, 10) : '9999-12-31';
      const db = b.due_date ? b.due_date.slice(0, 10) : '9999-12-31';
      return da.localeCompare(db);
    });
  }, [tasks]);

  const loading = engLoading && taskLoading;
  const refresh = async () => { await Promise.all([loadEng(), loadTasks()]); };
  const today = todayStr();

  return (
    <main className="min-h-screen bg-background text-foreground pb-safe">
      <PageHeader title="Inbox" backTo="/" />
      <div className="mx-auto max-w-3xl space-y-7 px-4 py-6 sm:px-6 sm:py-9">
        <PullToRefresh onRefresh={refresh}>
        {loading ? (
          <div className="py-14 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            {/* Important items */}
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Star className="h-4 w-4 text-primary" />Important items
                <span className="text-sm font-normal text-muted-foreground">{important.length}</span>
              </h2>
              {important.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/60 py-8 text-center text-sm text-muted-foreground">No active engagements needing attention.</p>
              ) : (
                <div className="space-y-2">
                  {important.map((e) => {
                    const date = e.deploy_date || e.speaking_date || e.start_date;
                    const overdue = date && date < today;
                    return (
                      <button key={e.id} onClick={() => navigate(`/engagements?engagementId=${e.id}`)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary/50">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold">{e.title || e.place || 'Engagement'}</span>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[e.status] || STATUS_TONE.Planning}`}>{e.status}</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                            {e.speaker_name && <span>{e.speaker_name}</span>}
                            {date && <span className={overdue ? 'font-medium text-destructive' : ''}>{formatDate(date)}{overdue ? ' · overdue' : ''}</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Follow-up Tasks */}
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" />Follow-up Tasks
                <span className="text-sm font-normal text-muted-foreground">{followups.length}</span>
              </h2>
              {followups.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/60 py-8 text-center text-sm text-muted-foreground">No outstanding tasks — you're all caught up.</p>
              ) : (
                <div className="space-y-2">
                  {followups.map((t) => {
                    const due = t.due_date ? t.due_date.slice(0, 10) : null;
                    const overdue = due && due < today;
                    return (
                      <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                        <button onClick={() => toggle(t)} aria-label="Mark task done" className="shrink-0 active:scale-90">
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.title}</p>
                          {due && <p className={`text-xs ${overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>Due {formatDate(due)}{overdue ? ' · overdue' : ''}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        <div className="h-28 lg:hidden" />
        </PullToRefresh>
      </div>
    </main>
  );
}