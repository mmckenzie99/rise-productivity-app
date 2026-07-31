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