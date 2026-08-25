import { useCallback, useEffect, useState } from 'react';
import { data } from '@/lib/workspaceData';

export default function useCalendarEvents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await data.entities.CalendarEvent.list('date'));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const off = data.entities.CalendarEvent.subscribe(load);
    return off;
  }, [load]);

  const save = async (item) => {
    const { id, created_date, updated_date, created_by_id, workspace_id, ...fields } = item;
    const tempId = id || `temp_${Date.now()}`;
    const optimistic = { ...item, id: tempId };
    setItems((prev) => (id ? prev.map((x) => (x.id === id ? { ...x, ...fields } : x)) : [...prev, optimistic]));
    try {
      const result = id
        ? await data.entities.CalendarEvent.update(id, fields)
        : await data.entities.CalendarEvent.create(fields);
      await load();
      return result;
    } catch (e) {
      await load();
      throw e;
    }
  };

  const remove = async (id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await data.entities.CalendarEvent.delete(id);
      await load();
    } catch (e) {
      await load();
      throw e;
    }
  };

  return { items, loading, save, remove, load };
}