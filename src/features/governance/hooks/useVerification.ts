import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Verification, VerificationStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface UseVerificationOptions {
    contentId: string;
    contentType: 'post' | 'comment' | 'project' | 'promise';
}

export function useVerification({ contentId, contentType }: UseVerificationOptions) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch verification data
    const { data: verification, isLoading, error } = useQuery({
        queryKey: ['verification', contentId, contentType],
        queryFn: async (): Promise<Verification | null> => {
            const { data, error } = await supabase
                .from('verifications')
                .select('*')
                .eq('content_id', contentId)
                .eq('content_type', contentType)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            if (!data) return null;

            // Fetch vote breakdown
            const { data: votes, error: votesError } = await supabase
                .from('verification_votes')
                .select('vote_type')
                .eq('verification_id', data.id);

            if (votesError) throw votesError;

            const breakdown = {
                true: votes?.filter(v => v.vote_type === 'true').length || 0,
                misleading: votes?.filter(v => v.vote_type === 'misleading').length || 0,
                outdated: votes?.filter(v => v.vote_type === 'outdated').length || 0,
            };

            return {
                id: data.id,
                contentId: data.content_id,
                contentType: data.content_type as 'post' | 'comment' | 'project' | 'promise',
                status: data.status as VerificationStatus,
                truthScore: data.truth_score,
                totalVotes: data.total_votes,
                breakdown,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
            };
        },
        enabled: !!contentId && !!contentType,
    });

    // Cast verification vote mutation
    const castVoteMutation = useMutation({
        mutationFn: async (voteType: 'true' | 'misleading' | 'outdated') => {
            if (!user) throw new Error('You must be logged in to vote');

            let verificationId = verification?.id;

            // Create verification entry if it doesn't exist
            if (!verificationId) {
                const { data: newVerification, error: createError } = await supabase
                    .from('verifications')
                    .insert({
                        content_id: contentId,
                        content_type: contentType,
                        status: 'PENDING',
                        truth_score: 50,
                        total_votes: 0,
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                verificationId = newVerification.id;
            }

            // Insert or update vote
            const { error: voteError } = await supabase
                .from('verification_votes')
                .upsert({
                    verification_id: verificationId,
                    user_id: user.id,
                    vote_type: voteType,
                }, {
                    onConflict: 'verification_id,user_id'
                });

            if (voteError) throw voteError;

            return { verificationId, voteType };
        },
        onSuccess: () => {
            // Invalidate and refetch verification data
            queryClient.invalidateQueries({
                queryKey: ['verification', contentId, contentType]
            });
        },
    });

    return {
        verification,
        isLoading,
        error: error ? (error as Error).message : null,
        castVote: castVoteMutation.mutate,
        isCastingVote: castVoteMutation.isPending,
    };
}
