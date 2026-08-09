import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useInboxItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await base44.entities.InboxItem.list('-created_date', 200));
    } catch (e) {
      console.error('Failed to load inbox items', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const off = base44.entities.InboxItem.subscribe(load);
    return off;
  }, [load]);

  const save = async (item) => {
    const { id, created_date, updated_date, created_by_id, ...fields } = item;
    if (id) await base44.entities.InboxItem.update(id, fields);
    else await base44.entities.InboxItem.create(fields);
    await load();
  };

const remove = async (id) => { const prevItems = items; setItems((prev) => prev.filter((t) => t.id !== id)); try { await base44.entities.InboxItem.delete(id); } catch (e) { console.error('Failed to delete inbox item', e); setItems(prevItems); } };

  return { items, loading, save, remove, load };
}