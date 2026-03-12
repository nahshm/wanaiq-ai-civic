import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OnboardingErrorBoundary } from '@/components/onboarding/OnboardingErrorBoundary';
import { useOnboardingRecovery } from '@/hooks/useOnboardingRecovery';
import Step1Location from './Step1Location';
import Step2Interests from './Step2Interests';
import Step3Persona from './Step3Persona';
import Step4Communities from './Step4Communities';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    countyId: '',
    constituencyId: '',
    wardId: '',
    interests: [] as string[],
    persona: '',
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { recoveredData, isRecovering } = useOnboardingRecovery();

  // Check if onboarding already completed
  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  // Recover progress if user had partial data
  useEffect(() => {
    if (recoveredData && !isRecovering) {
      if (recoveredData.hasPartialData) {
        // Resume from where user left off
        toast({
          title: "Welcome back!",
          description: "Resuming your onboarding from where you left off.",
        });

        setCurrentStep(Math.max(1, recoveredData.step));
        setOnboardingData({
          countyId: recoveredData.countyId || '',
          constituencyId: recoveredData.constituencyId || '',
          wardId: recoveredData.wardId || '',
          interests: recoveredData.interests || [],
          persona: recoveredData.persona || '',
        });
      }
    }
  }, [recoveredData, isRecovering]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_completed) {
      navigate('/');
    }
  };

  const handleNext = (data: Partial<typeof onboardingData>) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const progress = (currentStep / 4) * 100;

  // Show loading state while recovering data
  if (isRecovering) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-civic-green mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingErrorBoundary onReset={() => window.location.reload()}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to ama!</h1>
            <p className="text-muted-foreground">Let's connect you to your community</p>
          </div>

          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Step {currentStep} of 4
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            {currentStep === 1 && (
              <Step1Location
                onNext={handleNext}
                initialData={{
                  countyId: onboardingData.countyId,
                  constituencyId: onboardingData.constituencyId,
                  wardId: onboardingData.wardId,
                }}
              />
            )}
            {currentStep === 2 && (
              <Step2Interests
                onNext={handleNext}
                onBack={handleBack}
                initialData={{ interests: onboardingData.interests }}
              />
            )}
            {currentStep === 3 && (
              <Step3Persona
                onNext={handleNext}
                onBack={handleBack}
                initialData={{ persona: onboardingData.persona }}
              />
            )}
            {currentStep === 4 && (
              <Step4Communities
                onBack={handleBack}
                onboardingData={onboardingData}
              />
            )}
          </div>
        </div>
      </div>
    </OnboardingErrorBoundary>
  );
};

export default OnboardingFlow;
