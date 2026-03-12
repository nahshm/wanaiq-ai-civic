import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Post, GovernmentProject } from '@/types';

// Utility function to convert snake_case keys to camelCase recursively
function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result: any, key: string) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

interface Channel {
    id: string;
    name: string;
    type: string;
    category?: string;
}

interface Community {
    id: string;
    locationType?: string;
    locationValue?: string;
}

async function fetchChannelPosts(
    communityId: string,
    channelId: string,
    signal?: AbortSignal
): Promise<Post[]> {
    const { data: postsData } = await supabase
        .from('posts')
        .select(`
      *,
      author:profiles(*),
      community:communities(*),
      post_media(*)
    `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(signal);

    // Return posts directly — Supabase uses snake_case; do NOT apply toCamelCase
    // as it breaks field names like media_urls, post_media, created_at, etc.
    return (postsData || []).map((p) => ({
        ...p,
        media: p.post_media,
    })) as unknown as Post[];
}

async function fetchChannelProjects(
    community: Community,
    signal?: AbortSignal
): Promise<GovernmentProject[]> {
    if (!community.locationType || !community.locationValue) {
        return [];
    }

    // 1. Fetch base projects
    const { data: projectsData, error } = await supabase
        .from('government_projects')
        .select('*')
        .or(`${community.locationType}.eq.${community.locationValue}`)
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(signal);

    if (error) throw error;
    if (!projectsData) return [];

    // 2. Enrich projects with same logic as useProjects.ts
    const enrichedProjects = await Promise.all(
        projectsData.map(async (project) => {
            const enriched: any = { ...project };

            // Ensure camelCase conversion for base fields if needed, OR keep snake_case
            // The existing code uses toCamelCase at the end, which caused the media_urls issue.
            // Let's stick to the raw data structure as much as possible to match useProjects, 
            // but we must respect the return type GovernmentProject which defined in types/index.ts.
            // Wait, GovernmentProject interface in types/index.ts has snake_case keys for database fields?
            // Checking types/index.ts...
            // It has: budget_allocated, funding_source, media_urls
            // So we DO NOT want toCamelCase everything blindly if the type implies snake_case.
            // The previous code did `toCamelCase(projectsData)` which broke `media_urls`.
            // Let's NOT use toCamelCase for the main object if possible, or handle it carefully.

            // Fetch primary official
            if (project.primary_official_id) {
                const { data: official } = await supabase
                    .from('government_positions')
                    .select('id, title, governance_level, jurisdiction_name')
                    .eq('id', project.primary_official_id)
                    .single();
                enriched.primary_official = official;
            }

            // Fetch primary institution
            if (project.primary_institution_id) {
                const { data: institution } = await supabase
                    .from('government_institutions')
                    .select('id, name, acronym, institution_type')
                    .eq('id', project.primary_institution_id)
                    .single();
                enriched.primary_institution = institution;
            }

            // Fetch counts
            try {
                const [comments, verifications] = await Promise.all([
                    supabase
                        .from('project_comments')
                        .select('id', { count: 'exact', head: true })
                        .eq('project_id', project.id)
                        .then(r => r.count || 0),
                    supabase
                        .from('project_verifications')
                        .select('id', { count: 'exact', head: true })
                        .eq('project_id', project.id)
                        .eq('is_verified', true)
                        .then(r => r.count || 0)
                ]);

                enriched.comments_count = comments;
                enriched.verifications_count = verifications;
                enriched.views_count = 0;
            } catch (err) {
                enriched.comments_count = 0;
                enriched.verifications_count = 0;
            }

            return enriched;
        })
    );

    // We do NOT use toCamelCase here because GovernmentProject type expects snake_case for DB fields
    return enrichedProjects;
}

async function fetchChannelMembers(
    communityId: string,
    signal?: AbortSignal
): Promise<any[]> {
    const { data: membersData } = await supabase
        .from('community_members')
        .select(`
      *,
      profiles (username, display_name, avatar_url, role)
    `)
        .eq('community_id', communityId)
        .abortSignal(signal);

    return toCamelCase(membersData) || [];
}

export const useChannelContent = (
    communityId: string | undefined,
    channel: Channel | undefined,
    community: Community | undefined
) => {
    const isTextChannel = channel && ['feed', 'text', 'announcement'].includes(channel.type);
    const isProjectsChannel = channel?.name === 'projects-watch';

    // Posts query for text channels
    const {
        data: posts,
        isLoading: postsLoading,
        refetch: refetchPosts,
    } = useQuery({
        queryKey: ['channelPosts', communityId, channel?.id || 'none', channel?.name, channel?.type],
        queryFn: ({ signal }) => fetchChannelPosts(communityId!, channel!.id, signal),
        enabled: Boolean(communityId) && Boolean(channel?.id) && isTextChannel,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Projects query for projects-watch channel
    const {
        data: projects,
        isLoading: projectsLoading,
    } = useQuery({
        queryKey: ['channelProjects', communityId, channel?.id || 'none', channel?.name],
        queryFn: ({ signal }) => fetchChannelProjects(community!, signal),
        enabled: Boolean(communityId) && Boolean(channel?.id) && Boolean(community) && isProjectsChannel,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Members query (used for sidebar)
    const {
        data: members,
        isLoading: membersLoading,
    } = useQuery({
        queryKey: ['channelMembers', communityId],
        queryFn: ({ signal }) => fetchChannelMembers(communityId!, signal),
        enabled: !!communityId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        posts: posts ?? [],
        projects: projects ?? [],
        members: members ?? [],
        postsLoading,
        projectsLoading,
        membersLoading,
        refetchPosts,
    };
};
