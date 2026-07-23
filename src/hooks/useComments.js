import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useComments(engagementId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!engagementId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const list = await base44.entities.Comment.filter({ engagement_id: engagementId }, 'created_date');
    setItems(list);
    setLoading(false);
  }, [engagementId]);

  useEffect(() => {
    load();
    if (!engagementId) return;
    const off = base44.entities.Comment.subscribe(load);
    return off;
  }, [load, engagementId]);

  const add = async (body, author_name) => {
    if (!body?.trim() || !engagementId) return;
    await base44.entities.Comment.create({
      engagement_id: engagementId,
      body: body.trim(),
      author_name: author_name || 'Anonymous'
    });
    await load();
  };

  const remove = async (id) => {
    await base44.entities.Comment.delete(id);
    await load();
  };

  return { items, loading, add, remove };
}