import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Plus, Check } from 'lucide-react';
import useTasks from '@/hooks/useTasks';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import { useImportantFlags } from '@/lib/ImportantFlagsProvider';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import PageHeader from '@/components/speaking/PageHeader';
import TaskItem from '@/components/tasks/TaskItem';
import TaskForm from '@/components/tasks/TaskForm';
import CalendarEventForm from '@/components/speaking/CalendarEventForm';
import { buildPlanPrefillFromTask, createRecurringPlanSeries } from '@/lib/tasks';
import { data } from '@/lib/workspaceData';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const FILTERS = ['outstanding', 'done'];

const sourceLink = (it) => {
  switch (it.source_type) {
    case 'Engagement': return `/engagements?engagementId=${it.source_id}`;
    case 'Trip': return `/trips?tripId=${it.source_id}`;
    case 'CalendarEvent': return `/calendar?planId=${it.source_id}`;
    case 'Task': return '/inbox';
    case 'Fitness': return '/fitness';
    case 'DailyReflection':
    case 'FaithJournalEntry': {
      const k = (it.message_date || '').slice(0, 10);
      return k ? `/faith?date=${k}` : '/faith';
    }
    default: return '/inbox';
  }
};

export default function Inbox() {
  const navigate = useNavigate();
  const { flaggedItems } = useImportantFlags();
  const { items: tasks, loading, save, remove, toggle, load: loadTasks } = useTasks();
  const { items: plans, save: saveCalEvent } = useCalendarEvents();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('outstanding');
  const [scheduleTask, setScheduleTask] = useState(null);

  const outstanding = useMemo(
    () =>
      tasks
        .filter((t) => !t.is_done)
        .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999')),
    [tasks]
  );
  const done = useMemo(
    () => tasks.filter((t) => t.is_done).sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || '')),
    [tasks]
  );
  const shown = filter === 'done' ? done : outstanding;

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t) => { setEditing(t); setFormOpen(true); };

  const handleSave = async (taskFields, planForm) => {
    let linkedPlanId = taskFields.linked_plan_id || '';
    if (planForm) {
      try {
        linkedPlanId = await createRecurringPlanSeries(planForm, saveCalEvent);
        toast({ title: 'Recurring plan created', description: 'Added to the Agenda.' });
      } catch (e) {
        console.error('Failed to create recurring plan', e);
        toast({ title: 'Task saved', description: 'Recurring plan could not be created.', variant: 'destructive' });
      }
    }
    await save({ ...taskFields, linked_plan_id: linkedPlanId });
  };

  const openSchedule = (t) => setScheduleTask(t);
  const closeSchedule = () => setScheduleTask(null);
  const handleScheduleSave = async (planItem) => {
    const saved = await saveCalEvent(planItem);
    if (scheduleTask?.id && saved?.id) {
      await data.entities.Task.update(scheduleTask.id, { converted_to_plan_id: saved.id, is_done: true });
      await loadTasks();
      toast({ title: 'Scheduled as plan', description: 'Task marked done and linked.' });
    }
    setScheduleTask(null);
    setFormOpen(false);
  };
  const planPrefill = scheduleTask ? buildPlanPrefillFromTask(scheduleTask) : null;

  const refresh = async () => { await loadTasks(); };

  return (
    <main className="min-h-screen bg-background text-foreground pb-safe">
      <PageHeader title="Inbox" actions={
        <button
          onClick={openNew}
          aria-label="New Task"
          className="inline-flex items-center gap-1 rounded-md bg-[#D9A404] px-2.5 py-2 text-white transition hover:bg-[#B89003]"
        >
          <Plus className="h-4 w-4" /><Check className="h-4 w-4" />
        </button>
      } />
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
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Tasks (outstanding + done) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  Tasks
                  <span className="text-sm font-normal text-muted-foreground">{outstanding.length}</span>
                </h2>
              </div>

              <div className="flex gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium capitalize transition',
                      filter === f
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {shown.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/60 py-8 text-center text-sm text-muted-foreground">
                  {filter === 'done' ? 'No completed tasks yet.' : 'No outstanding tasks — you\'re all caught up.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {shown.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onToggle={toggle}
                      onEdit={openEdit}
                      onSchedule={openSchedule}
                      onDelete={remove}
                      linkedPlanTitle={plans.find((p) => p.id === t.linked_plan_id)?.title}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="h-28 lg:hidden" />
        </PullToRefresh>
      </div>

      <TaskForm
        open={formOpen}
        item={editing}
        plans={plans}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        onSchedule={openSchedule}
      />
      <CalendarEventForm
        open={!!scheduleTask}
        item={planPrefill}
        admins={[]}
        assignableUsers={[]}
        onClose={closeSchedule}
        onSave={handleScheduleSave}
      />
    </main>
  );
}