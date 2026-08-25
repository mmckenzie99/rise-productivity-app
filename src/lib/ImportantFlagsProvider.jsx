import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { data } from '@/lib/workspaceData';

// App-wide important-flag state. An InboxItem with is_important=true is created
// (or toggled) for any source record a user flags. Cards consume useImportantFlags()
// to render their flag state and toggle it; the Inbox consumes flaggedItems to
// list them. One provider wraps the authenticated app so all cards share a single
// load + realtime subscription.
const Ctx = createContext(null);

export function ImportantFlagsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await data.entities.InboxItem.list('-created_date', 500));
    } catch (e) {
      console.error('Failed to load important flags', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const off = data.entities.InboxItem.subscribe(load);
    return off;
  }, [load]);

  const flaggedKeys = useMemo(() => {
    const s = new Set();
    items.forEach((i) => {
      if (i.is_important && i.source_type && i.source_id) s.add(`${i.source_type}:${i.source_id}`);
    });
    return s;
  }, [items]);

  const flaggedItems = useMemo(
    () => items.filter((i) => i.is_important).sort((a, b) => (b.created_date || '').localeCompare(a.created_date || '')),
    [items]
  );

  const toggle = useCallback(async (sourceType, sourceId, title) => {
    const existing = items.find((i) => i.source_type === sourceType && i.source_id === sourceId);
    try {
      if (existing) {
        const next = !existing.is_important;
        await data.entities.InboxItem.update(existing.id, { is_important: next });
        setItems((prev) => prev.map((i) => (i.id === existing.id ? { ...i, is_important: next } : i)));
      } else {
        const created = await data.entities.InboxItem.create({
          message_text: title || '',
          is_important: true,
          source_type: sourceType,
          source_id: sourceId,
          source_title: title || '',
          entity_type: 'None',
        });
        setItems((prev) => [created, ...prev]);
      }
    } catch (e) {
      console.error('Failed to toggle important flag', e);
      await load();
    }
  }, [items, load]);

  return (
    <Ctx.Provider value={{ flaggedKeys, flaggedItems, toggle, loading, load }}>
      {children}
    </Ctx.Provider>
  );
}

export function useImportantFlags() {
  const ctx = useContext(Ctx);
  if (!ctx) return { flaggedKeys: new Set(), flaggedItems: [], toggle: async () => {}, loading: true, load: async () => {} };
  return ctx;
}