import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useTrips() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await base44.entities.Trip.list('-created_date'));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const off = base44.entities.Trip.subscribe(load);
    return off;
  }, [load]);

  const save = async (item) => {
    const { id, created_date, updated_date, created_by_id, ...fields } = item;
    const tempId = id || `temp_${Date.now()}`;
    const optimistic = { ...item, id: tempId };
    setItems((prev) => (id ? prev.map((x) => (x.id === id ? { ...x, ...fields } : x)) : [...prev, optimistic]));
    try {
      if (id) await base44.entities.Trip.update(id, fields);
      else await base44.entities.Trip.create(fields);
      await load();
    } catch (e) {
      await load();
      throw e;
    }
  };

  const remove = async (id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await base44.entities.Trip.delete(id);
      await load();
    } catch (e) {
      await load();
      throw e;
    }
  };

  return { items, loading, save, remove, load };
}