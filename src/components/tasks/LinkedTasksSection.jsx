import { useCallback, useEffect, useState } from 'react';
import { ListTodo } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Reads Tasks linked to a given plan (linked_plan_id) and renders them as a
// simple checklist. Toggling a checkbox flips that task's is_done, exactly like
// the Tasks page. Subscribes to Task changes so newly linked tasks appear live.
export default function LinkedTasksSection({ planId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Task.filter({ linked_plan_id: planId });
      setTasks(list);
    } catch (e) {
      console.error('Failed to load linked tasks', e);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    load();
    const off = base44.entities.Task.subscribe(load);
    return off;
  }, [planId, load]);

  const toggle = async (task) => {
    await base44.entities.Task.update(task.id, { is_done: !task.is_done });
    await load();
  };

  if (loading || tasks.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <Label className="inline-flex items-center gap-1.5 text-sm font-medium">
        <ListTodo className="h-4 w-4" />
        Linked tasks
      </Label>
      <div className="space-y-1 rounded-md border border-border bg-background p-1.5">
        {tasks.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-start gap-2.5 rounded p-1.5 transition hover:bg-accent/40"
          >
            <Checkbox checked={!!t.is_done} onCheckedChange={() => toggle(t)} className="mt-0.5" />
            <span className={cn('break-words text-sm', t.is_done && 'line-through text-muted-foreground')}>
              {t.title}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}