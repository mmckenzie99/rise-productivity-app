import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Role-based defaults for every feature flag. Admins are always granted
// full access, so only the collaborator ('user') default is meaningful.
export const DEFAULT_FEATURES = {
  can_comment: { admin: true, user: false },
  can_be_assigned: { admin: true, user: false },
};

let cache = { features: DEFAULT_FEATURES };
let loadPromise = null;
const listeners = new Set();

async function loadSettings(isAdmin) {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const list = await base44.entities.AppSettings.list();
      if (list.length > 0) {
        cache = { ...list[0], features: { ...DEFAULT_FEATURES, ...(list[0].features || {}) } };
      } else if (isAdmin) {
        const created = await base44.entities.AppSettings.create({ features: DEFAULT_FEATURES });
        cache = { ...created, features: { ...DEFAULT_FEATURES, ...(created.features || {}) } };
      } else {
        cache = { features: DEFAULT_FEATURES };
      }
    } catch (e) {
      console.error('Failed to load app settings', e);
      cache = { features: DEFAULT_FEATURES };
    } finally {
      loadPromise = null;
    }
    return cache;
  })();
  return loadPromise;
}

// Loads and caches the singleton AppSettings record and keeps every consumer
// in sync. `update` writes a new `features` object (admin only).
export function useAppSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [settings, setSettings] = useState(cache);

  useEffect(() => {
    loadSettings(isAdmin).then((s) => {
      setSettings(s);
      listeners.forEach((l) => l(s));
    });
    const listener = (s) => setSettings(s);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [isAdmin]);

  const update = async (features) => {
    const updated = await base44.entities.AppSettings.update(cache.id, { features });
    cache = { ...cache, features: { ...DEFAULT_FEATURES, ...(updated.features || {}) } };
    setSettings(cache);
    listeners.forEach((l) => l(cache));
    return cache;
  };

  return { settings: settings || { features: DEFAULT_FEATURES }, update };
}