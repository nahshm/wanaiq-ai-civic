import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileCustomization {
    userId: string;
    theme: string;
    frameAnimation: string | null;
    accentColor: string;
    bannerAnimationUrl: string | null;
    walkoutSoundUrl: string | null;
    hasPremiumFeatures: boolean;
    premiumUntil: string | null;
}

interface UseProfileCustomizationParams {
    userId: string;
    enabled?: boolean;
}

// Available themes
export const THEMES = [
    // Free themes
    { id: 'light', name: 'Light', premium: false, preview: 'bg-white' },
    { id: 'dark', name: 'Dark', premium: false, preview: 'bg-gray-900' },
    { id: 'county_nairobi', name: 'Nairobi Green', premium: false, preview: 'bg-gradient-to-r from-green-600 to-green-400' },
    { id: 'county_mombasa', name: 'Mombasa Blue', premium: false, preview: 'bg-gradient-to-r from-blue-600 to-cyan-400' },
    { id: 'county_kisumu', name: 'Kisumu Sunset', premium: false, preview: 'bg-gradient-to-r from-orange-500 to-pink-500' },
    { id: 'county_nakuru', name: 'Nakuru Earth', premium: false, preview: 'bg-gradient-to-r from-amber-700 to-yellow-500' },
    // Premium/Earned themes
    { id: 'constitution_gold', name: 'Constitution Gold', premium: true, preview: 'bg-gradient-to-r from-yellow-600 to-amber-400' },
    { id: 'activist_red', name: 'Activist Red', premium: true, preview: 'bg-gradient-to-r from-red-600 to-pink-500' },
    { id: 'eco_green', name: 'Eco Guardian', premium: true, preview: 'bg-gradient-to-r from-emerald-600 to-teal-400' },
    { id: 'civic_blue', name: 'Civic Blue', premium: true, preview: 'bg-gradient-to-r from-blue-600 to-indigo-400' },
];

// Available frame animations
export const FRAME_ANIMATIONS = [
    { id: null, name: 'None', premium: false, description: 'No animation' },
    { id: 'ballot_spin', name: 'Ballot Spin', premium: false, description: 'Spinning ballot box effect' },
    { id: 'flag_wave', name: 'Flag Wave', premium: false, description: 'Kenyan flag wave' },
    { id: 'stars_glow', name: 'Stars Glow', premium: true, description: 'Glowing stars around avatar' },
    { id: 'civic_pulse', name: 'Civic Pulse', premium: true, description: 'Pulsing civic colors' },
    { id: 'verified_shine', name: 'Verified Shine', premium: true, description: 'Special shine for verified users' },
];

/**
 * Hook to manage profile customizations
 */
export function useProfileCustomization({ userId, enabled = true }: UseProfileCustomizationParams) {
    const queryClient = useQueryClient();

    const {
        data: customization,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['profile-customization', userId],
        queryFn: async (): Promise<ProfileCustomization | null> => {
            const { data, error } = await supabase
                .from('profile_customizations')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                // Return defaults
                return {
                    userId,
                    theme: 'dark',
                    frameAnimation: null,
                    accentColor: '#3B82F6',
                    bannerAnimationUrl: null,
                    walkoutSoundUrl: null,
                    hasPremiumFeatures: false,
                    premiumUntil: null,
                };
            }

            return {
                userId: data.user_id,
                theme: data.theme,
                frameAnimation: data.frame_animation,
                accentColor: data.accent_color,
                bannerAnimationUrl: data.banner_animation_url,
                walkoutSoundUrl: data.walkout_sound_url,
                hasPremiumFeatures: data.has_premium_features,
                premiumUntil: data.premium_until,
            };
        },
        enabled: enabled && !!userId,
        staleTime: 10 * 60 * 1000,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (updates: Partial<ProfileCustomization>) => {
            const { error } = await supabase
                .from('profile_customizations')
                .upsert({
                    user_id: userId,
                    theme: updates.theme,
                    frame_animation: updates.frameAnimation,
                    accent_color: updates.accentColor,
                    banner_animation_url: updates.bannerAnimationUrl,
                    walkout_sound_url: updates.walkoutSoundUrl,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile-customization', userId] });
        },
    });

    // Check if user can use premium features
    const canUsePremium = (): boolean => {
        if (!customization) return false;
        if (!customization.hasPremiumFeatures) return false;
        if (!customization.premiumUntil) return true;
        return new Date(customization.premiumUntil) > new Date();
    };

    return {
        customization,
        isLoading,
        isError,
        refetch,
        update: updateMutation.mutate,
        isUpdating: updateMutation.isPending,
        canUsePremium,
        themes: THEMES,
        frameAnimations: FRAME_ANIMATIONS,
    };
}

export default useProfileCustomization;
