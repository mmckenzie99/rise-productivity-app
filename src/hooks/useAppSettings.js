import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Role-based defaults for every feature flag. Admins are always granted
// full access, so only the collaborator ('user') default is meaningful.
export const DASHBOARD_SECTION_DEFAULTS = {
  stat_cards: { admin: true, user: true },
  plans: { admin: true, user: true },
  status_chart: { admin: true, user: true },
  category_chart: { admin: true, user: true },
  monthly_chart: { admin: true, user: true },
  weekly_goals: { admin: true, user: true },
};

export const DEFAULT_FEATURES = {
  can_comment: { admin: true, user: false },
  can_be_assigned: { admin: true, user: false },
  can_create_personal_plans: { admin: true, user: true },
  can_create_work_plans: { admin: true, user: false },
  can_start_chats: { admin: true, user: true },
  dashboard_sections: { ...DASHBOARD_SECTION_DEFAULTS },
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
        const stored = list[0].features || {};
        cache = { ...list[0], features: { ...DEFAULT_FEATURES, ...stored, dashboard_sections: { ...DASHBOARD_SECTION_DEFAULTS, ...(stored.dashboard_sections || {}) } } };
      } else if (isAdmin) {
        const created = await base44.entities.AppSettings.create({ features: DEFAULT_FEATURES });
        const stored = created.features || {};
        cache = { ...created, features: { ...DEFAULT_FEATURES, ...stored, dashboard_sections: { ...DASHBOARD_SECTION_DEFAULTS, ...(stored.dashboard_sections || {}) } } };
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
    const stored = updated.features || {};
    cache = { ...cache, features: { ...DEFAULT_FEATURES, ...stored, dashboard_sections: { ...DASHBOARD_SECTION_DEFAULTS, ...(stored.dashboard_sections || {}) } } };
    setSettings(cache);
    listeners.forEach((l) => l(cache));
    return cache;
  };

  return { settings: settings || { features: DEFAULT_FEATURES }, update };
}