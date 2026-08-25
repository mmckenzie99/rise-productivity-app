import { useCallback, useEffect, useState } from 'react';
import { data } from '@/lib/workspaceData';
import { useAuth } from '@/lib/AuthContext';

export default function usePlanComments(calendarEventId) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!calendarEventId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const list = await data.entities.PlanComment.filter({ calendar_event_id: calendarEventId }, 'created_date');
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
    const off = data.entities.PlanComment.subscribe(load);
    return off;
  }, [load, calendarEventId]);

  const add = async (body, author_name) => {
    if (!body?.trim() || !calendarEventId) return;
    const payload = {
      calendar_event_id: calendarEventId,
      body: body.trim(),
      author_name: author_name || user?.full_name || 'Member',
    };
    const temp = { id: `temp_${Date.now()}`, ...payload, created_date: new Date().toISOString() };
    setItems((prev) => [...prev, temp]);
    try {
      await data.entities.PlanComment.create(payload);
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
      await data.entities.PlanComment.delete(id);
      await load();
    } catch (e) {
      setItems(snapshot);
      throw e;
    }
  };

  return { items, loading, add, remove };
}