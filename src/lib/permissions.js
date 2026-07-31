// Centralized permission helpers.
// The Owner (is_owner) always has full access. For everyone else, an explicitly
// set per-user flag (true or false) overrides the role default for that person;
// when the flag is unset, the role's default (managed in AppSettings) applies.
// This lets the Owner toggle any administrator or collaborator on or off
// individually, regardless of the role default.
export const isAdmin = (user) => user?.role === 'admin';
export const isOwner = (user) => !!user?.is_owner;

export const resolveFeature = (user, settings, key) => {
  if (isOwner(user)) return true;
  const v = user?.[key];
  if (v === true) return true;
  if (v === false) return false;
  const role = user?.role || 'user';
  return settings?.features?.[key]?.[role] === true;
};

// Resolves a plan-creation category flag using the same model as resolveFeature.
export const resolvePlanFlag = resolveFeature;