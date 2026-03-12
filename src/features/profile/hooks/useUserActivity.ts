import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserActivityItem {
    id: string;
    type: 'post' | 'comment' | 'civic_action' | 'badge';
    title: string;
    description?: string;
    created_at: string;
    link?: string;
    metadata?: Record<string, any>;
}

export const useUserActivity = (userId: string) => {
    return useQuery({
        queryKey: ['user-activity', userId],
        queryFn: async (): Promise<UserActivityItem[]> => {
            if (!userId) return [];

            const activities: UserActivityItem[] = [];

            // Fetch posts
            const { data: posts } = await supabase
                .from('posts')
                .select('id, title, created_at, content')
                .eq('author_id', userId)
                .order('created_at', { ascending: false })
                .limit(10) as { data: any[] | null };

            if (posts) {
                posts.forEach(post => activities.push({
                    id: post.id,
                    type: 'post',
                    title: post.title || 'Untitled Post',
                    description: post.content?.substring(0, 100),
                    created_at: post.created_at,
                    link: `/posts/${post.id}`,
                }));
            }

            // Fetch civic actions
            const { data: actions } = await supabase
                .from('civic_actions')
                .select('id, title, description, created_at, status')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (actions) {
                actions.forEach(action => activities.push({
                    id: action.id,
                    type: 'civic_action',
                    title: action.title,
                    description: action.description?.substring(0, 100),
                    created_at: action.created_at,
                    metadata: { status: action.status },
                }));
            }

            // Fetch recent badges
            const { data: badges } = await supabase
                .from('user_badges')
                .select('id, awarded_at, badge:badges(name, description)')
                .eq('user_id', userId)
                .order('awarded_at', { ascending: false })
                .limit(5);

            if (badges) {
                badges.forEach((ub: any) => activities.push({
                    id: ub.id,
                    type: 'badge',
                    title: `Earned: ${ub.badge?.name || 'Badge'}`,
                    description: ub.badge?.description,
                    created_at: ub.awarded_at,
                }));
            }

            // Sort all activities by date
            return activities.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        },
        enabled: !!userId,
        staleTime: 60 * 1000, // 1 minute
    });
};
