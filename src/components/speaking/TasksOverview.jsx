import { Link } from 'react-router-dom';
import { ListTodo, ChevronRight } from 'lucide-react';
import useTasks from '@/hooks/useTasks';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import TaskItem from '@/components/tasks/TaskItem';

export default function TasksOverview() {
  const { items, loading, toggle } = useTasks();
  const { items: plans } = useCalendarEvents();
  const outstanding = items
    .filter((t) => !t.is_done)
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))
    .slice(0, 4);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
          <ListTodo className="h-5 w-5 text-primary" />
          Tasks
        </h2>
        <Link
          to="/tasks"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>
      ) : outstanding.length === 0 ? (
        <div className="py-4 text-center text-sm text-muted-foreground">No outstanding tasks.</div>
      ) : (
        <div className="space-y-2">
          {outstanding.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={toggle}
              compact
              linkedPlanTitle={plans.find((p) => p.id === t.linked_plan_id)?.title}
            />
          ))}
        </div>
      )}
    </section>
  );
}