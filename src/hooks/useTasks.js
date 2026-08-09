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
    if (id) await base44.entities.Task.update(id, fields);
    else await base44.entities.Task.create(fields);
    await load();
  };

  const toggle = async (task) => {
    await base44.entities.Task.update(task.id, { is_done: !task.is_done });
    await load();
  };

  const remove = async (id) => {
    await base44.entities.Task.delete(id);
    await load();
  };

  return { items, loading, save, remove, toggle, load };
}