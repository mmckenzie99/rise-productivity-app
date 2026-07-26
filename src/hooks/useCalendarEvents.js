import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useCalendarEvents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await base44.entities.CalendarEvent.list('date'));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const off = base44.entities.CalendarEvent.subscribe(load);
    return off;
  }, [load]);

  const save = async (item) => {
    const { id, created_date, updated_date, created_by_id, ...fields } = item;
    id
      ? await base44.entities.CalendarEvent.update(id, fields)
      : await base44.entities.CalendarEvent.create(fields);
    await load();
  };

  const remove = async (id) => {
    await base44.entities.CalendarEvent.delete(id);
    await load();
  };

  return { items, loading, save, remove, load };
}