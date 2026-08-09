import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import useTasks from '@/hooks/useTasks';
import useCalendarEvents from '@/hooks/useCalendarEvents';
import TaskItem from '@/components/tasks/TaskItem';
import TaskForm from '@/components/tasks/TaskForm';
import { cn } from '@/lib/utils';

const FILTERS = ['outstanding', 'done'];

export default function Tasks() {
  const { items, loading, save, remove, toggle } = useTasks();
  const { items: plans } = useCalendarEvents();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('outstanding');

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
                onDelete={remove}
              />
            ))}
          </div>
        )}

        <div className="h-28 lg:hidden" />
      </div>

      <TaskForm open={formOpen} item={editing} plans={plans} onClose={() => setFormOpen(false)} onSave={save} />
    </main>
  );
}