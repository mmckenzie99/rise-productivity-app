import { useAuth } from '@/lib/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';
import { isAdmin, resolveFeature } from '@/lib/permissions';

// Reads the current user's permission profile, combining per-user flags with
// the role-based defaults managed in AppSettings.
export default function usePermissions() {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  return {
    isAdmin: isAdmin(user),
    canComment: resolveFeature(user, settings, 'can_comment'),
    canBeAssigned: resolveFeature(user, settings, 'can_be_assigned'),
  };
}