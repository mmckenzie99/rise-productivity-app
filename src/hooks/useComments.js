import { useCallback, useEffect, useState } from 'react';
import { data } from '@/lib/workspaceData';
import { useAuth } from '@/lib/AuthContext';

export default function useComments(engagementId) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!engagementId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const list = await data.entities.Comment.filter({ engagement_id: engagementId }, 'created_date');
    setItems(list);
    setLoading(false);
  }, [engagementId]);

  useEffect(() => {
    load();
    if (!engagementId) return;
    const off = data.entities.Comment.subscribe(load);
    return off;
  }, [load, engagementId]);

  const add = async (body, author_name) => {
    if (!body?.trim() || !engagementId) return;
    const payload = { engagement_id: engagementId, body: body.trim(), author_name: author_name || user?.full_name || 'Member' };
    const temp = { id: `temp_${Date.now()}`, ...payload, created_date: new Date().toISOString() };
    setItems((prev) => [...prev, temp]);
    try {
      await data.entities.Comment.create(payload);
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
      await data.entities.Comment.delete(id);
      await load();
    } catch (e) {
      setItems(snapshot);
      throw e;
    }
  };

  return { items, loading, add, remove };
}