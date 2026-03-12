import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useOnboarding = () => {
  const { user, profile, profileMissing, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    // If profile is missing, stop loading - ProfileRecovery will handle this
    if (profileMissing) {
      setNeedsOnboarding(true);
      setLoading(false);
      return;
    }

    // Use profile from AuthContext which is the single source of truth
    if (profile) {
      setNeedsOnboarding(!profile.onboardingCompleted);
      setLoading(false);
    } else {
      // Profile still loading from AuthContext
      setLoading(true);
    }
  }, [user, profile, profileMissing, authLoading]);

  return { needsOnboarding, loading };
};
