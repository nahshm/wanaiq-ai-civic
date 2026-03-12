import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectEntity {
    id: string;
    name?: string;
    title?: string;
    acronym?: string | null;
    institution_type?: string;
    governance_level?: string;
}

export interface ProjectWithFullDetails {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    budget_allocated: number | null;
    funding_source: string | null;
    project_level: string;
    county: string | null;
    constituency: string | null;
    ward: string | null;
    planned_start_date: string | null;
    planned_completion_date: string | null;
    progress_percentage: number;
    media_urls: string[] | null;
    documents_urls: string[] | null;
    created_at: string;
    is_verified: boolean;

    // Primary responsible entity
    primary_responsible_type: 'official' | 'institution';
    primary_official: ProjectEntity | null;
    primary_institution: ProjectEntity | null;

    // Collaborators
    collaborating_officials: { official: ProjectEntity }[];
    collaborating_institutions: { institution: ProjectEntity }[];

    // Engagement
    updates_count: number;
    comments_count: number;
    verifications_count: number;
    views_count: number;

    // Latest updates
    recent_updates: Array<{
        id: string;
        title: string;
        description: string;
        update_type: string;
        created_at: string;
        media_urls: string[] | null;
        community_verified: boolean;
        author: {
            id: string;
            username: string;
            avatar_url: string | null;
        } | null;
    }>;
}

// Fetch single project with full details
export function useProjectDetails(projectId: string | undefined) {
    return useQuery({
        queryKey: ['project-details', projectId],
        queryFn: async () => {
            if (!projectId) throw new Error('Project ID required');

            // First check if new columns exist by querying basic project data
            const { data: basicData, error: basicError } = await supabase
                .from('government_projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (basicError) throw basicError;

            // Initialize with basic data
            const projectData: any = { ...basicData };

            // Try to fetch new relationships if columns exist
            try {
                // Check if primary_official_id exists and fetch if so
                if (basicData.primary_official_id) {
                    const { data: official } = await supabase
                        .from('government_positions')
                        .select('id, title, governance_level, jurisdiction_name')
                        .eq('id', basicData.primary_official_id)
                        .single();

                    projectData.primary_official = official;
                }

                // Check if primary_institution_id exists and fetch if so
                if (basicData.primary_institution_id) {
                    const { data: institution } = await supabase
                        .from('government_institutions')
                        .select('id, name, acronym, institution_type')
                        .eq('id', basicData.primary_institution_id)
                        .single();

                    projectData.primary_institution = institution;
                }

                // Fetch collaborating officials
                const { data: collabOfficials } = await supabase
                    .from('project_collaborating_officials')
                    .select(`
            official:government_positions(id, title, governance_level)
          `)
                    .eq('project_id', projectId);

                projectData.collaborating_officials = collabOfficials || [];

                // Fetch collaborating institutions
                const { data: collabInstitutions } = await supabase
                    .from('project_collaborating_institutions')
                    .select(`
            institution:government_institutions(id, name, acronym, institution_type)
          `)
                    .eq('project_id', projectId);

                projectData.collaborating_institutions = collabInstitutions || [];

            } catch (relError) {
                // Tables/columns don't exist yet, that's okay
                console.log('New schema not available yet:', relError);
                projectData.collaborating_officials = [];
                projectData.collaborating_institutions = [];
            }

            // Fetch updates
            try {
                const { data: updates } = await supabase
                    .from('project_updates')
                    .select('id, title, description, update_type, created_at, media_urls, community_verified, created_by')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // Fetch authors separately to avoid FK constraint issues
                if (updates && updates.length > 0) {
                    const enrichedUpdates = await Promise.all(
                        updates.map(async (update) => {
                            const { data: author } = await supabase
                                .from('profiles')
                                .select('id, username, avatar_url')
                                .eq('id', update.created_by)
                                .single();

                            return {
                                ...update,
                                author: author || null
                            };
                        })
                    );
                    projectData.recent_updates = enrichedUpdates;
                } else {
                    projectData.recent_updates = [];
                }
            } catch (updateError) {
                console.log('Updates table not available yet:', updateError);
                projectData.recent_updates = [];
            }

            // Get counts separately for better performance
            try {
                const updatesCount = await supabase.from('project_updates').select('id', { count: 'exact', head: true }).eq('project_id', projectId);
                projectData.updates_count = updatesCount.count || 0;
            } catch {
                projectData.updates_count = 0;
            }

            try {
                const commentsCount = await supabase.from('project_comments').select('id', { count: 'exact', head: true }).eq('project_id', projectId);
                projectData.comments_count = commentsCount.count || 0;
            } catch {
                projectData.comments_count = 0;
            }

            try {
                const verificationsCount = await supabase.from('project_verifications').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('is_verified', true);
                projectData.verifications_count = verificationsCount.count || 0;
            } catch {
                projectData.verifications_count = 0;
            }

            // Fetch views count
            try {
                const viewsCount = await supabase
                    .from('project_views')
                    .select('id', { count: 'exact', head: true })
                    .eq('project_id', projectId);
                projectData.views_count = viewsCount.count || 0;
            } catch {
                projectData.views_count = 0;
            }

            return projectData as ProjectWithFullDetails;
        },
        enabled: !!projectId,
        staleTime: 30 * 1000, // 30 seconds
        retry: 2
    });
}

// Fetch projects list with basic details + counts
export function useProjects(filters?: {
    status?: string;
    county?: string;
    category?: string;
    search?: string;
}) {
    return useQuery({
        queryKey: ['projects', filters],
        queryFn: async () => {
            let query = supabase
                .from('government_projects')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            // Apply filters
            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            if (filters?.county && filters.county !== 'all') {
                query = query.eq('county', filters.county);
            }
            if (filters?.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }
            if (filters?.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            const { data: projects, error } = await query;

            if (error) throw error;

            if (!projects) return [];

            // Fetch related data for each project separately (handles missing columns gracefully)
            const enrichedProjects = await Promise.all(
                projects.map(async (project) => {
                    const enriched: any = { ...project };

                    // Try to fetch primary entities if IDs exist
                    try {
                        if (project.primary_official_id) {
                            const { data: official } = await supabase
                                .from('government_positions')
                                .select('id, title')
                                .eq('id', project.primary_official_id)
                                .single();
                            enriched.primary_official = official;
                        }

                        if (project.primary_institution_id) {
                            const { data: institution } = await supabase
                                .from('government_institutions')
                                .select('id, name, acronym')
                                .eq('id', project.primary_institution_id)
                                .single();
                            enriched.primary_institution = institution;
                        }

                        // Count collaborators
                        const [officialsCount, institutionsCount] = await Promise.all([
                            supabase
                                .from('project_collaborating_officials')
                                .select('id', { count: 'exact', head: true })
                                .eq('project_id', project.id)
                                .then(r => ({ count: r.count || 0 })),
                            supabase
                                .from('project_collaborating_institutions')
                                .select('id', { count: 'exact', head: true })
                                .eq('project_id', project.id)
                                .then(r => ({ count: r.count || 0 }))
                        ]);

                        enriched.collaborating_officials = [{ count: officialsCount.count }];
                        enriched.collaborating_institutions = [{ count: institutionsCount.count }];

                    } catch (err) {
                        // Columns don't exist yet - that's okay
                        console.log('New schema not yet available for project:', project.id);
                    }

                    // Get engagement counts
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
                        // Fetch views count
                        const views = await supabase
                            .from('project_views')
                            .select('id', { count: 'exact', head: true })
                            .eq('project_id', project.id)
                            .then(r => r.count || 0);
                        enriched.views_count = views;
                    } catch (err) {
                        enriched.comments_count = 0;
                        enriched.verifications_count = 0;
                        enriched.views_count = 0;
                    }

                    return enriched;
                })
            );

            return enrichedProjects;
        },
        staleTime: 60 * 1000, // 1 minute
        retry: 2
    });
}

// Track project view
export async function trackProjectView(projectId: string, userId?: string) {
    if (!userId) return; // Only track for authenticated users

    try {
        await supabase.from('project_views').insert({
            project_id: projectId,
            user_id: userId
        });
    } catch (error) {
        console.error('Error tracking view:', error);
        // Silent fail - don't block user experience
    }
}
