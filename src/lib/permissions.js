// Centralized permission helpers.
// The Owner (is_owner) always has full access. For everyone else, a feature is
// enabled when the user's per-user flag is explicitly on OR their role's default
// (managed in AppSettings) is on. This applies to admins and collaborators
// alike, so an admin role default of false actually restricts that feature for
// admins — toggle individuals on per user to grant access.
export const isAdmin = (user) => user?.role === 'admin';
export const isOwner = (user) => !!user?.is_owner;

export const resolveFeature = (user, settings, key) => {
  if (isOwner(user)) return true;
  if (user?.[key] === true) return true;
  const role = user?.role || 'user';
  return settings?.features?.[key]?.[role] === true;
};

// Resolves a plan-creation category flag using the same model as resolveFeature.
export const resolvePlanFlag = resolveFeature;