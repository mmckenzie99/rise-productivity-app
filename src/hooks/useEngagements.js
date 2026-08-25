import { useCallback, useEffect, useState } from 'react';
import { data } from '@/lib/workspaceData';

export default function useEngagements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await data.entities.Engagement.list('speaking_date'));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const off = data.entities.Engagement.subscribe(load);
    return off;
  }, [load]);

  const save = async (item) => {
    const { id, created_date, updated_date, created_by_id, workspace_id, ...fields } = item;
    const d = {
      ...fields,
      latitude: fields.latitude === '' ? null : Number(fields.latitude),
      longitude: fields.longitude === '' ? null : Number(fields.longitude),
    };
    const tempId = id || `temp_${Date.now()}`;
    const optimistic = { ...item, id: tempId, ...d };
    setItems((prev) => (id ? prev.map((x) => (x.id === id ? { ...x, ...d } : x)) : [...prev, optimistic]));
    try {
      if (id) await data.entities.Engagement.update(id, d);
      else await data.entities.Engagement.create(d);
      await load();
    } catch (e) {
      await load();
      throw e;
    }
  };

  const remove = async (id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await data.entities.Engagement.delete(id);
      await load();
    } catch (e) {
      await load();
      throw e;
    }
  };

  return { items, loading, save, remove, load };
}