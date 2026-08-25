import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import useTasks from '@/hooks/useTasks';
import { useImportantFlags } from '@/lib/ImportantFlagsProvider';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import PageHeader from '@/components/speaking/PageHeader';
import { formatDate } from '@/lib/speaking';

// Repurposed Inbox — two sections:
//  • Important items: records the user explicitly flagged (InboxItem with
//    is_important=true), each linking back to its source.
//  • Follow-up Tasks: outstanding tasks (not done), sorted by due date.
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const sourceLink = (it) => {
  switch (it.source_type) {
    case 'Engagement': return `/engagements?engagementId=${it.source_id}`;
    case 'Trip': return `/trips?tripId=${it.source_id}`;
    case 'CalendarEvent': return `/calendar?planId=${it.source_id}`;
    case 'Task': return '/tasks';
    case 'Fitness': return '/fitness';
    default: return '/inbox';
  }
};

export default function Inbox() {
  const navigate = useNavigate();
  const { flaggedItems } = useImportantFlags();
  const { items: tasks, loading: taskLoading, toggle, load: loadTasks } = useTasks();

  const followups = useMemo(() => {
    const open = tasks.filter((t) => !t.is_done);
    return open.sort((a, b) => {
      const da = a.due_date ? a.due_date.slice(0, 10) : '9999-12-31';
      const db = b.due_date ? b.due_date.slice(0, 10) : '9999-12-31';
      return da.localeCompare(db);
    });
  }, [tasks]);

  const loading = taskLoading;
  const refresh = async () => { await loadTasks(); };
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
            {/* Important items (flagged) */}
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Flag className="h-4 w-4 text-primary" />Important items
                <span className="text-sm font-normal text-muted-foreground">{flaggedItems.length}</span>
              </h2>
              {flaggedItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/60 py-8 text-center text-sm text-muted-foreground">
                  No items flagged as important yet. Tap the flag on any engagement, trip, plan, task, or fitness log to pin it here.
                </p>
              ) : (
                <div className="space-y-2">
                  {flaggedItems.map((it) => (
                    <button key={it.id} onClick={() => navigate(sourceLink(it))} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary/50">
                      <Flag className="h-4 w-4 shrink-0 fill-primary text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{it.source_title || it.message_text || 'Item'}</p>
                        <p className="text-xs text-muted-foreground">{it.source_type}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
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