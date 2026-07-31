import { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';
import { resolveFeature, resolvePlanFlag } from '@/lib/permissions';

// Returns whether the current user may access `featureKey`. Resolves per-user
// overrides first, then the role-based default from AppSettings. Admins always
// have access.
export default function useFeatureFlag(featureKey) {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  return useMemo(() => resolveFeature(user, settings, featureKey), [user, settings, featureKey]);
}

// Like useFeatureFlag but for plan-creation category flags, where admins are
// NOT auto-granted — the AppSettings role default controls access.
export function usePlanFlag(featureKey) {
  const { user } = useAuth();
  const { settings } = useAppSettings();
  return useMemo(() => resolvePlanFlag(user, settings, featureKey), [user, settings, featureKey]);
}