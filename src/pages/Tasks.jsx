import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useTasks from '@/hooks/useTasks';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import TaskItem from '@/components/tasks/TaskItem';
import TaskForm from '@/components/tasks/TaskForm';
import CalendarEventForm from '@/components/speaking/CalendarEventForm';
import { buildPlanPrefillFromTask } from '@/lib/tasks';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const FILTERS = ['outstanding', 'done'];

export default function Tasks() {
  const { items, loading, save, remove, toggle, load: loadTasks } = useTasks();
  const { items: plans, save: saveCalEvent } = useCalendarEvents();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('outstanding');
  const [scheduleTask, setScheduleTask] = useState(null);

  const outstanding = useMemo(
    () =>
      items
        .filter((t) => !t.is_done)
        .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999')),
    [items]
  );
  const done = useMemo(
    () => items.filter((t) => t.is_done).sort((a, b) => (b.updated_date || '').localeCompare(a.updated_date || '')),
    [items]
  );
  const shown = filter === 'done' ? done : outstanding;

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t) => { setEditing(t); setFormOpen(true); };

  const openSchedule = (t) => setScheduleTask(t);
  const closeSchedule = () => setScheduleTask(null);
  const handleScheduleSave = async (planItem) => {
    const saved = await saveCalEvent(planItem);
    if (scheduleTask?.id && saved?.id) {
      await base44.entities.Task.update(scheduleTask.id, { converted_to_plan_id: saved.id, is_done: true });
      await loadTasks();
      toast({ title: 'Scheduled as plan', description: 'Task marked done and linked.' });
    }
    setScheduleTask(null);
    setFormOpen(false);
  };
  const planPrefill = scheduleTask ? buildPlanPrefillFromTask(scheduleTask) : null;

  return (
    <main className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6 sm:py-9">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="font-display text-2xl font-semibold">Tasks</h1>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#D9A404] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#B89003]"
          >
            <Plus className="h-4 w-4" />New
          </button>
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

        {loading ? (
          <div className="py-14 text-center text-sm text-muted-foreground">Loading tasks…</div>
        ) : shown.length === 0 ? (
          <div className="rounded-lg border border-dashed border-primary bg-card/60 py-14 text-center">
            <h2 className="font-display text-xl font-semibold">
              {filter === 'done' ? 'No completed tasks' : 'No outstanding tasks'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === 'done' ? 'Completed tasks will show here.' : 'You are all caught up.'}
            </p>
          </div>
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

        <div className="h-28 lg:hidden" />
      </div>

      <TaskForm
        open={formOpen}
        item={editing}
        plans={plans}
        onClose={() => setFormOpen(false)}
        onSave={save}
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