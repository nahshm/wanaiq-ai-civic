import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Community, Post } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';

interface CommunityWithMembership extends Community {
  isFollowing: boolean;
}

async function fetchCommunitiesWithMembership(
  userId?: string,
  signal?: AbortSignal
): Promise<CommunityWithMembership[]> {
  // Fetch all communities
  const { data: communitiesData, error: communitiesError } = await supabase
    .from('communities')
    .select('*')
    .abortSignal(signal);

  if (communitiesError) throw communitiesError;

  // Fetch user memberships if logged in
  const joinedCommunityIds = new Set<string>();
  if (userId) {
    const { data: memberships, error: membershipsError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId)
      .abortSignal(signal);

    if (membershipsError) throw membershipsError;

    if (memberships) {
      memberships.forEach(m => joinedCommunityIds.add(m.community_id));
    }
  }

  // Map to Community type with membership status
  return (communitiesData || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    displayName: c.display_name || c.name,
    description: c.description || '',
    memberCount: c.member_count || 0,
    category: c.category || 'discussion',
    isFollowing: joinedCommunityIds.has(c.id),
    avatarUrl: c.avatar_url,
    bannerUrl: c.banner_url,
    type: c.type || 'interest',
    sensitivityLevel: c.sensitivity_level || 'public'
  }));
}

export const useCommunityData = () => {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main communities query with React Query
  const {
    data: communities = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['communities', 'all', user?.id],
    queryFn: ({ signal }) => fetchCommunitiesWithMembership(user?.id, signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Toggle membership mutation with optimistic updates
  const toggleMutation = useMutation({
    mutationFn: async (communityId: string) => {
      if (!user) throw new Error('Not authenticated');

      const community = communities.find(c => c.id === communityId);
      if (!community) throw new Error('Community not found');

      const isFollowing = community.isFollowing;

      if (isFollowing) {
        const { error } = await supabase
          .from('community_members')
          .delete()
          .eq('community_id', communityId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_members')
          .insert({ community_id: communityId, user_id: user.id });
        if (error) throw error;
      }

      return { communityId, wasFollowing: isFollowing };
    },
    onMutate: async (communityId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['communities', 'all', user?.id] });

      // Snapshot previous value
      const previousCommunities = queryClient.getQueryData<CommunityWithMembership[]>(
        ['communities', 'all', user?.id]
      );

      // Optimistically update
      if (previousCommunities) {
        queryClient.setQueryData<CommunityWithMembership[]>(
          ['communities', 'all', user?.id],
          previousCommunities.map(c =>
            c.id === communityId
              ? {
                ...c,
                isFollowing: !c.isFollowing,
                memberCount: c.memberCount + (c.isFollowing ? -1 : 1)
              }
              : c
          )
        );
      }

      return { previousCommunities };
    },
    onError: (err, communityId, context) => {
      // Rollback on error
      if (context?.previousCommunities) {
        queryClient.setQueryData(['communities', 'all', user?.id], context.previousCommunities);
      }
      toast({
        title: 'Error',
        description: 'Failed to update membership',
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      const community = communities.find(c => c.id === data.communityId);
      toast({
        title: data.wasFollowing ? 'Left community' : 'Joined community',
        description: `You have ${data.wasFollowing ? 'left' : 'joined'} ${community?.displayName}`,
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['communities', 'all', user?.id] });
    },
  });

  const toggleCommunityFollow = async (communityId: string) => {
    if (!user) {
      authModal.open('login');
      return;
    }
    toggleMutation.mutate(communityId);
  };

  // Mock posts state (to maintain API compatibility)
  const posts: Post[] = [];

  const voteOnPost = (postId: string, vote: 'up' | 'down') => {
    // TODO: Implement real voting with React Query mutation
  };

  const addPost = (newPost: Post) => {
    // TODO: Implement real post creation with React Query mutation
  };

  return {
    communities,
    posts,
    loading,
    error,
    toggleCommunityFollow,
    isTogglingFollow: toggleMutation.isPending,
    voteOnPost,
    addPost,
    refetch,
  };
};