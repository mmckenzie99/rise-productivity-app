import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useEngagements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await base44.entities.Engagement.list('speaking_date'));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const off = base44.entities.Engagement.subscribe(load);
    return off;
  }, [load]);

  const save = async (item) => {
    const { id, created_date, updated_date, created_by_id, ...fields } = item;
    const data = {
      ...fields,
      latitude: fields.latitude === '' ? null : Number(fields.latitude),
      longitude: fields.longitude === '' ? null : Number(fields.longitude),
    };
    const tempId = id || `temp_${Date.now()}`;
    const optimistic = { ...item, id: tempId, ...data };
    setItems((prev) => (id ? prev.map((x) => (x.id === id ? { ...x, ...data } : x)) : [...prev, optimistic]));
    try {
      if (id) await base44.entities.Engagement.update(id, data);
      else await base44.entities.Engagement.create(data);
      await load();
    } catch (e) {
      await load();
      throw e;
    }
  };

  const remove = async (id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await base44.entities.Engagement.delete(id);
      await load();
    } catch (e) {
      await load();
      throw e;
    }
  };

  return { items, loading, save, remove, load };
}