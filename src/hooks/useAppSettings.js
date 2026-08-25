// In the no-account model there are no roles or per-role feature flags — every
// workspace member is an equal owner. useAppSettings now returns permissive
// defaults synchronously so existing resolveFeature / resolveDashboardSection
// calls (which short-circuit to true for the synthetic owner user) keep working
// without any database access.
export const DASHBOARD_SECTION_DEFAULTS = {
  stat_cards: { admin: true, user: true },
  plans: { admin: true, user: true },
  status_chart: { admin: true, user: true },
  category_chart: { admin: true, user: true },
  monthly_chart: { admin: true, user: true },
  weekly_goals: { admin: true, user: true },
};

export const DEFAULT_FEATURES = {
  can_comment: { admin: true, user: true },
  can_be_assigned: { admin: true, user: true },
  can_create_personal_plans: { admin: true, user: true },
  can_create_work_plans: { admin: true, user: true },
  can_start_chats: { admin: true, user: true },
  can_view_reflections: { admin: true, user: true },
  dashboard_sections: { ...DASHBOARD_SECTION_DEFAULTS },
};

const FALLBACK = { features: DEFAULT_FEATURES };

export function useAppSettings() {
  return { settings: FALLBACK, update: async () => FALLBACK };
}