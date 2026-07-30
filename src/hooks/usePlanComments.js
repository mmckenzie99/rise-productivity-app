import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function usePlanComments(calendarEventId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!calendarEventId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const list = await base44.entities.PlanComment.filter({ calendar_event_id: calendarEventId }, 'created_date');
      setItems(list);
    } catch (e) {
      console.error('Failed to load plan comments', e);
    } finally {
      setLoading(false);
    }
  }, [calendarEventId]);

  useEffect(() => {
    load();
    if (!calendarEventId) return;
    const off = base44.entities.PlanComment.subscribe(load);
    return off;
  }, [load, calendarEventId]);

  const add = async (body, author_name, notify_admin_id, notify_admin_name) => {
    if (!body?.trim() || !calendarEventId) return;
    const payload = {
      calendar_event_id: calendarEventId,
      body: body.trim(),
      author_name: author_name || 'Admin',
      notify_admin_id: notify_admin_id || '',
      notify_admin_name: notify_admin_name || '',
    };
    const temp = { id: `temp_${Date.now()}`, ...payload, created_date: new Date().toISOString() };
    setItems((prev) => [...prev, temp]);
    try {
      await base44.entities.PlanComment.create(payload);
      await load();
    } catch (e) {
      setItems((prev) => prev.filter((c) => c.id !== temp.id));
      throw e;
    }
  };

  const remove = async (id) => {
    const snapshot = items;
    setItems((prev) => prev.filter((c) => c.id !== id));
    try {
      await base44.entities.PlanComment.delete(id);
      await load();
    } catch (e) {
      setItems(snapshot);
      throw e;
    }
  };

  return { items, loading, add, remove };
}