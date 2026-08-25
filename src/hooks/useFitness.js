import { useCallback, useEffect, useState } from 'react';
import { data } from '@/lib/workspaceData';

export default function useFitness() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await data.entities.Fitness.list('-date', 500));
    } catch (e) {
      console.error('Failed to load fitness entries', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const off = data.entities.Fitness.subscribe(load);
    return off;
  }, [load]);

  const save = async (item) => {
    const { id, created_date, updated_date, created_by_id, workspace_id, ...fields } = item;
    if (id) {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...fields } : x)));
      try {
        await data.entities.Fitness.update(id, fields);
      } catch (e) {
        console.error('Failed to save fitness entry', e);
        await load();
      }
    } else {
      try {
        const created = await data.entities.Fitness.create(fields);
        setItems((prev) => [created, ...prev]);
      } catch (e) {
        console.error('Failed to create fitness entry', e);
      }
    }
  };

  const remove = async (id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await data.entities.Fitness.delete(id);
    } catch (e) {
      console.error('Failed to delete fitness entry', e);
      await load();
    }
  };

  return { items, loading, save, remove, load };
}