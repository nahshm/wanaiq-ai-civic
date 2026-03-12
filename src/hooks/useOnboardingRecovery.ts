import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RecoveredData {
    step: number;
    countyId?: string;
    constituencyId?: string;
    wardId?: string;
    interests?: string[];
    persona?: string;
    hasPartialData: boolean;
}

/**
 * Hook to recover onboarding progress if user's session crashed or was interrupted
 * 
 * Checks:
 * - onboarding_progress table for last completed step
 * - profiles table for partial location/persona data
 * - user_interests table for selected interests
 * 
 * Usage:
 * ```tsx
 * const { recoveredData, isRecovering } = useOnboardingRecovery();
 * 
 * useEffect(() => {
 *   if (recoveredData?.hasPartialData) {
 *     toast.info('Resuming from where you left off');
 *     setCurrentStep(recoveredData.step);
 *   }
 * }, [recoveredData]);
 * ```
 */
export const useOnboardingRecovery = () => {
    const { user } = useAuth();
    const [recoveredData, setRecoveredData] = useState<RecoveredData | null>(null);
    const [isRecovering, setIsRecovering] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsRecovering(false);
            return;
        }

        const recoverData = async () => {
            try {
                // 1. Check onboarding progress table
                const { data: progress } = await supabase
                    .from('onboarding_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                // 2. Get profile data (location and persona)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('county_id, constituency_id, ward_id, persona, onboarding_completed')
                    .eq('id', user.id)
                    .single();

                // If onboarding already completed, no need to recover
                if (profile?.onboarding_completed) {
                    setRecoveredData(null);
                    setIsRecovering(false);
                    return;
                }

                // 3. Get user interests
                const { data: interests } = await supabase
                    .from('user_interests')
                    .select('interest_id')
                    .eq('user_id', user.id);

                // 4. Determine what step to resume from
                let step = 0;
                const hasPartialData = !!(
                    profile?.county_id ||
                    profile?.constituency_id ||
                    profile?.ward_id ||
                    interests?.length ||
                    profile?.persona
                );

                if (progress && progress.step_completed) {
                    // Use saved progress
                    step = progress.step_completed;
                } else if (hasPartialData) {
                    // Infer step from available data (probably crashed mid-onboarding)
                    if (profile?.county_id) step = Math.max(step, 1); // Completed location
                    if (interests && interests.length > 0) step = Math.max(step, 2); // Completed interests
                    if (profile?.persona) step = Math.max(step, 3); // Completed persona
                }

                setRecoveredData({
                    step,
                    countyId: profile?.county_id || undefined,
                    constituencyId: profile?.constituency_id || undefined,
                    wardId: profile?.ward_id || undefined,
                    interests: interests?.map(i => i.interest_id) || [],
                    persona: profile?.persona || undefined,
                    hasPartialData,
                });
            } catch (error) {
                console.error('Error recovering onboarding data:', error);
                // Don't block onboarding if recovery fails
                setRecoveredData(null);
            } finally {
                setIsRecovering(false);
            }
        };

        recoverData();
    }, [user]);

    return { recoveredData, isRecovering };
};
