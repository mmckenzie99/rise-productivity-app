// Centralized permission helpers.
// The Owner (is_owner) always has full access. For everyone else, an explicitly
// set per-user flag (true or false) overrides the role default for that person;
// when the flag is unset, the role's default (managed in AppSettings) applies.
// This lets the Owner toggle any administrator or collaborator on or off
// individually, regardless of the role default.
export const isAdmin = (user) => user?.role === 'admin';
export const isOwner = (user) => !!user?.is_owner;

export const resolveFeature = (user, settings, key) => {
  if (!user) return true; // public app: anonymous visitors can use all features
  if (isOwner(user)) return true;
  const v = user?.[key];
  if (v === true) return true;
  if (v === false) return false;
  const role = user?.role || 'user';
  return settings?.features?.[key]?.[role] === true;
};

// Dashboard sections the Owner can show/hide per role. Owner always sees all.
export const DASHBOARD_SECTIONS = [
  { id: 'stat_cards', label: 'Summary stats', description: 'Top engagement & plan count cards' },
  { id: 'plans', label: 'Plans', description: 'Upcoming, completed, edited & rescheduled plan lists' },
  { id: 'status_chart', label: 'Engagements by status', description: 'Status breakdown pie chart' },
  { id: 'category_chart', label: 'Plans by category', description: 'Personal vs. work pie chart' },
  { id: 'monthly_chart', label: 'Engagements by month', description: 'Monthly bar chart' },
  { id: 'weekly_goals', label: 'Weekly Goals', description: 'Weekly goals overview' },
];

// Resolves whether a given Dashboard section is visible to the user.
export const resolveDashboardSection = (user, settings, id) => {
  if (!user) return true;
  if (isOwner(user)) return true;
  const role = user?.role || 'user';
  return settings?.features?.dashboard_sections?.[id]?.[role] !== false;
};

// Resolves a plan-creation category flag using the same model as resolveFeature.
export const resolvePlanFlag = resolveFeature;