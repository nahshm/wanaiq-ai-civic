import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileRecovery } from '@/components/auth/ProfileRecovery';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const { user, profileMissing, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip check if still loading or not authenticated
    if (authLoading || onboardingLoading || !user) {
      return;
    }

    // Allow access to onboarding and auth pages
    const allowedPaths = ['/onboarding', '/auth'];
    if (allowedPaths.some(path => location.pathname.startsWith(path))) {
      return;
    }

    // Redirect to onboarding if needed
    if (needsOnboarding) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, needsOnboarding, authLoading, onboardingLoading, location.pathname, navigate]);

  // Show loading state
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show profile recovery UI if user exists but profile is missing
  if (user && profileMissing) {
    return <ProfileRecovery />;
  }

  return <>{children}</>;
};
