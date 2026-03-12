import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to get the current user's office_holder ID if they are a verified official
 * Returns null if user is not an office holder or not verified
 */
export const useOfficeHolderId = () => {
    const { user } = useAuth();

    const { data: officeHolderId, isLoading, error } = useQuery({
        queryKey: ['office-holder-id', user?.id],
        queryFn: async () => {
            if (!user?.id || typeof user.id !== 'string') {
                return null;
            }

            const { data, error } = await supabase
                .from('office_holders')
                .select('id')
                .eq('user_id', user.id)
                .eq('verification_status', 'verified')
                .maybeSingle();

            if (error) {
                console.error('Error fetching office holder ID:', error);
                return null;
            }

            return data?.id || null;
        },
        enabled: !!user?.id,
        staleTime: 60 * 60 * 1000, // 1 hour - office holder status changes infrequently
        retry: 1, // Only retry once on failure
    });

    return { officeHolderId, isLoading, error };
};
