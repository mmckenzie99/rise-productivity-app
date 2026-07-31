// Centralized permission helpers. Administrators always have full access;
// collaborator-level access is granted per user via the can_comment and
// can_be_assigned flags on their User record.
export const isAdmin = (user) => user?.role === 'admin';

export const canComment = (user) => isAdmin(user) || !!user?.can_comment;

export const canBeAssigned = (user) => isAdmin(user) || !!user?.can_be_assigned;