import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useTasks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await base44.entities.Task.list('-created_date', 200));
    } catch (e) {
      console.error('Failed to load tasks', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const off = base44.entities.Task.subscribe(load);
    return off;
  }, [load]);

  const save = async (item) => {
    const { id, created_date, updated_date, created_by_id, ...fields } = item;
    if (id) {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
      try {
        await base44.entities.Task.update(id, fields);
      } catch (e) {
        console.error('Failed to save task', e);
        await load();
      }
    } else {
      try {
        const created = await base44.entities.Task.create(fields);
        setItems((prev) => [created, ...prev]);
      } catch (e) {
        console.error('Failed to create task', e);
      }
    }
  };

const toggle = async (task) => { setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_done: !task.is_done } : t))); try { await base44.entities.Task.update(task.id, { is_done: !task.is_done }); } catch (e) { console.error('Failed to toggle task', e); setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_done: task.is_done } : t))); } };

const remove = async (taskOrId) => { const id = typeof taskOrId === 'object' ? taskOrId?.id : taskOrId; if (!id) return; const prevItems = items; setItems((prev) => prev.filter((t) => t.id !== id)); try { await base44.entities.Task.delete(id); } catch (e) { console.error('Failed to delete task', e); setItems(prevItems); } };

  return { items, loading, save, remove, toggle, load };
}