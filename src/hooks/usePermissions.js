import { useAuth } from '@/lib/AuthContext';
import { isAdmin, canComment, canBeAssigned } from '@/lib/permissions';

// Reads the current user's permission profile from auth context.
export default function usePermissions() {
  const { user } = useAuth();
  return {
    isAdmin: isAdmin(user),
    canComment: canComment(user),
    canBeAssigned: canBeAssigned(user),
  };
}