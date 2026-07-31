// Centralized permission helpers.
// Administrators always have full access. For everyone else, a feature is
// enabled when their per-user flag is explicitly on OR their role's default
// (managed in AppSettings) is on.
export const isAdmin = (user) => user?.role === 'admin';

export const resolveFeature = (user, settings, key) => {
  if (isAdmin(user)) return true;
  if (user?.[key] === true) return true;
  const role = user?.role || 'user';
  return settings?.features?.[key]?.[role] === true;
};

// Resolves a plan-creation category flag. Unlike resolveFeature, admins are
// NOT auto-granted — the AppSettings role default decides, so an admin role
// default of false actually restricts that category for admins. A per-user
// flag (if present on the User record) still overrides the role default.
export const resolvePlanFlag = (user, settings, key) => {
  if (user?.[key] === true) return true;
  const role = user?.role || 'user';
  return settings?.features?.[key]?.[role] === true;
};