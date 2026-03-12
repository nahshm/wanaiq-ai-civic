import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { FEED_CONFIG } from '@/constants/feed';

export type VoteItemType = 'post' | 'comment';
export type VoteType = 'up' | 'down';

interface UseVoteOptions {
    itemType: VoteItemType;
    onOptimisticUpdate?: (itemId: string, newVote: VoteType | null, prevVote: VoteType | null) => void;
}

interface VoteResult {
    itemId: string;
    voteType: VoteType;
    action: 'added' | 'removed' | 'changed';
    newUserVote: VoteType | null;
}

export function useVote({ itemType, onOptimisticUpdate }: UseVoteOptions) {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Rate limiting - track last vote time per item
    const lastVoteTime = useRef<{ [key: string]: number }>({});

    const voteMutation = useMutation({
        mutationFn: async ({ itemId, voteType }: { itemId: string; voteType: VoteType }): Promise<VoteResult> => {
            if (!user) {
                throw new Error('Authentication required');
            }

            // Build the query based on item type
            const idField = itemType === 'post' ? 'post_id' : 'comment_id';

            // Check if user already voted
            const { data: existingVote, error: fetchError } = await supabase
                .from('votes')
                .select('*')
                .eq('user_id', user.id)
                .eq(idField, itemId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            let action: 'added' | 'removed' | 'changed';
            let newUserVote: VoteType | null;

            if (existingVote) {
                if (existingVote.vote_type === voteType) {
                    // Same vote - remove it
                    const { error: deleteError } = await supabase
                        .from('votes')
                        .delete()
                        .eq('id', existingVote.id);

                    if (deleteError) throw deleteError;
                    action = 'removed';
                    newUserVote = null;
                } else {
                    // Different vote - update it
                    const { error: updateError } = await supabase
                        .from('votes')
                        .update({ vote_type: voteType })
                        .eq('id', existingVote.id);

                    if (updateError) throw updateError;
                    action = 'changed';
                    newUserVote = voteType;
                }
            } else {
                // No existing vote - create new
                const insertData: Record<string, string> = {
                    user_id: user.id,
                    vote_type: voteType,
                };
                insertData[idField] = itemId;

                const { error: insertError } = await supabase
                    .from('votes')
                    .insert(insertData as any);

                if (insertError) throw insertError;
                action = 'added';
                newUserVote = voteType;
            }

            return { itemId, voteType, action, newUserVote };
        },
        onMutate: async ({ itemId, voteType }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: [itemType, itemId] });

            // Return context for potential rollback
            return { itemId, voteType };
        },
        onError: (error, _variables, _context) => {
            console.error('Vote error:', error);

            if (error.message === 'Authentication required') {
                authModal.open('login');
            } else {
                toast({
                    title: "Error",
                    description: `Failed to vote on ${itemType}`,
                    variant: "destructive",
                });
            }
        },
        onSuccess: (result) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['comments'] });

            // Call optimistic update callback if provided
            if (onOptimisticUpdate) {
                const prevVote = result.action === 'removed' ? result.voteType :
                    result.action === 'changed' ? (result.voteType === 'up' ? 'down' : 'up') : null;
                onOptimisticUpdate(result.itemId, result.newUserVote, prevVote as VoteType | null);
            }
        },
    });

    const vote = useCallback((itemId: string, voteType: VoteType) => {
        if (!user) {
            authModal.open('login');
            return;
        }

        // Rate limiting check
        const now = Date.now();
        const lastTime = lastVoteTime.current[itemId] || 0;
        if (now - lastTime < FEED_CONFIG.VOTE_COOLDOWN_MS) {
            toast({
                title: "Slow down",
                description: "Please wait a moment before voting again",
                variant: "default",
            });
            return;
        }

        lastVoteTime.current[itemId] = now;
        voteMutation.mutate({ itemId, voteType });
    }, [user, itemType, authModal, toast, voteMutation]);

    return {
        vote,
        isVoting: voteMutation.isPending,
        error: voteMutation.error,
    };
}

/**
 * Helper function to calculate new vote counts based on vote changes
 */
export function calculateVoteChanges(
    currentUpvotes: number,
    currentDownvotes: number,
    currentUserVote: VoteType | null,
    newVoteType: VoteType
): { upvotes: number; downvotes: number; userVote: VoteType | null } {
    let upvotes = currentUpvotes;
    let downvotes = currentDownvotes;
    let userVote: VoteType | null = newVoteType;

    // Remove previous vote effect
    if (currentUserVote === 'up') upvotes--;
    if (currentUserVote === 'down') downvotes--;

    // If clicking same vote, remove it
    if (currentUserVote === newVoteType) {
        userVote = null;
    } else {
        // Add new vote effect
        if (newVoteType === 'up') upvotes++;
        if (newVoteType === 'down') downvotes++;
    }

    return { upvotes, downvotes, userVote };
}
