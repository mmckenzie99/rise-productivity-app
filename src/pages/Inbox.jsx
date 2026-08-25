import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, BookOpen, Dumbbell, Users } from 'lucide-react';
import useTasks from '@/hooks/useTasks';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import { useImportantFlags } from '@/lib/ImportantFlagsProvider';
import PullToRefresh from '@/components/speaking/PullToRefresh';
import PageHeader from '@/components/speaking/PageHeader';
import TaskItem from '@/components/tasks/TaskItem';
import TaskForm from '@/components/tasks/TaskForm';
import CalendarEventForm from '@/components/speaking/CalendarEventForm';
import InboxSection from '@/components/inbox/InboxSection';
import FlaggedItemRow from '@/components/inbox/FlaggedItemRow';
import { buildPlanPrefillFromTask, createRecurringPlanSeries } from '@/lib/tasks';
import { data } from '@/lib/workspaceData';
import { toast } from '@/components/ui/use-toast';

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
  const { flaggedItems, toggle: toggleFlag } = useImportantFlags();
  const { items: tasks, loading, save, remove, toggle, load: loadTasks } = useTasks();
  const { items: plans, save: saveCalEvent } = useCalendarEvents();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scheduleTask, setScheduleTask] = useState(null);

  const outstanding = useMemo(
    () =>
      tasks
        .filter((t) => !t.is_done)
        .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999')),
    [tasks]
  );

  const faithFlags = useMemo(() => flaggedItems.filter((i) => i.source_type === 'FaithJournalEntry'), [flaggedItems]);
  const fitnessFlags = useMemo(() => flaggedItems.filter((i) => i.source_type === 'Fitness'), [flaggedItems]);
  const engagementFlags = useMemo(() => flaggedItems.filter((i) => i.source_type === 'Engagement'), [flaggedItems]);

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
            {/* 1. Faith Journal Entry */}
            <InboxSection icon={<BookOpen className="h-4 w-4 text-primary" />} title="Faith Journal Entry" count={faithFlags.length}>
              {faithFlags.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/60 py-8 text-center text-sm text-muted-foreground">
                  No sermon-prep entries flagged yet. Mark a Faith journal entry as sermon prep to pin it here.
                </p>
              ) : (
                <div className="space-y-2">
                  {faithFlags.map((it) => (
                    <FlaggedItemRow
                      key={it.id}
                      icon={<BookOpen className="h-4 w-4 shrink-0 text-primary" />}
                      item={it}
                      onNavigate={() => navigate(sourceLink(it))}
                      onUntag={() => toggleFlag(it.source_type, it.source_id, it.source_title)}
                    />
                  ))}
                </div>
              )}
            </InboxSection>

            {/* 2. Fitness Journal Entry */}
            <InboxSection icon={<Dumbbell className="h-4 w-4 text-primary" />} title="Fitness Journal Entry" count={fitnessFlags.length}>
              {fitnessFlags.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/60 py-8 text-center text-sm text-muted-foreground">
                  No workouts flagged for follow-up yet. Use “Flag for follow-up” on a workout log to pin it here.
                </p>
              ) : (
                <div className="space-y-2">
                  {fitnessFlags.map((it) => (
                    <FlaggedItemRow
                      key={it.id}
                      icon={<Dumbbell className="h-4 w-4 shrink-0 text-primary" />}
                      item={it}
                      onNavigate={() => navigate(sourceLink(it))}
                      onUntag={() => toggleFlag(it.source_type, it.source_id, it.source_title)}
                    />
                  ))}
                </div>
              )}
            </InboxSection>

            {/* 3. Engagement Follow-up */}
            <InboxSection icon={<Users className="h-4 w-4 text-primary" />} title="Engagement Follow-up" count={engagementFlags.length}>
              {engagementFlags.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/60 py-8 text-center text-sm text-muted-foreground">
                  No engagements flagged for follow-up yet. Use “Flag for follow-up” on an engagement to pin it here.
                </p>
              ) : (
                <div className="space-y-2">
                  {engagementFlags.map((it) => (
                    <FlaggedItemRow
                      key={it.id}
                      icon={<Users className="h-4 w-4 shrink-0 text-primary" />}
                      item={it}
                      onNavigate={() => navigate(sourceLink(it))}
                      onUntag={() => toggleFlag(it.source_type, it.source_id, it.source_title)}
                    />
                  ))}
                </div>
              )}
            </InboxSection>

            {/* 4. Tasks */}
            <InboxSection icon={<Check className="h-4 w-4 text-primary" />} title="Tasks" count={outstanding.length}>
              {outstanding.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-card/60 py-8 text-center text-sm text-muted-foreground">
                  No outstanding tasks — you're all caught up.
                </p>
              ) : (
                <div className="space-y-2">
                  {outstanding.map((t) => (
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
            </InboxSection>
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