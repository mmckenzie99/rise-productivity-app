import { useEffect, useState, useCallback, useMemo } from 'react';
import { data } from '@/lib/workspaceData';

// Loads all workspace FaithJournalEntry records and exposes a Set of dates
// that have a saved entry, used by the Agenda to render Faith indicators.
export default function useReflections() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await data.entities.FaithJournalEntry.list('-date', 500));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const dateSet = useMemo(() => new Set(items.map((r) => r.date).filter(Boolean)), [items]);
  return { items, loading, load, dateSet };
}