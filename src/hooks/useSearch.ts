import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface SearchFilters {
  communityId?: string
  authorId?: string
  dateFrom?: string
  dateTo?: string
  status?: string
}

export interface SearchParams {
  query: string
  type?: 'all' | 'posts' | 'comments' | 'users' | 'communities' | 'officials' | 'promises' | 'projects'
  filters?: SearchFilters
  sort?: 'relevance' | 'date' | 'votes'
  limit?: number
  offset?: number
}

export interface SearchResults {
  posts: any[]
  comments: any[]
  users: any[]
  communities: any[]
  officials: any[]
  promises: any[]
  projects: any[]
}

export const useSearch = (params: SearchParams) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: async (): Promise<SearchResults> => {
      const { query, type = 'all', filters = {}, sort = 'relevance', limit = 20, offset = 0 } = params

      const results: SearchResults = {
        posts: [],
        comments: [],
        users: [],
        communities: [],
        officials: [],
        promises: [],
        projects: []
      }

      // Search posts with fuzzy matching
      if (type === 'all' || type === 'posts') {
        // Try full-text search first, then fallback to ILIKE
        let postsQuery = supabase
          .from('posts')
          .select(`
            id, title, content, created_at, upvotes, downvotes, comment_count,
            author:profiles!author_id(id, username, display_name, avatar_url),
            community:communities(id, name, display_name)
          `)

        // Use ILIKE for fuzzy matching (case-insensitive partial match)
        const searchPattern = `%${query}%`
        postsQuery = postsQuery.or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)

        if (filters.communityId) postsQuery = postsQuery.eq('community_id', filters.communityId)
        if (filters.authorId) postsQuery = postsQuery.eq('author_id', filters.authorId)
        if (filters.dateFrom) postsQuery = postsQuery.gte('created_at', filters.dateFrom)
        if (filters.dateTo) postsQuery = postsQuery.lte('created_at', filters.dateTo)

        if (sort === 'date') {
          postsQuery = postsQuery.order('created_at', { ascending: false })
        } else if (sort === 'votes') {
          postsQuery = postsQuery.order('upvotes', { ascending: false })
        } else {
          // For relevance, order by created_at desc as default
          postsQuery = postsQuery.order('created_at', { ascending: false })
        }

        postsQuery = postsQuery.range(offset, offset + limit - 1)

        const { data: posts } = await postsQuery
        results.posts = posts || []
      }

      // Search comments
      if (type === 'all' || type === 'comments') {
        const { data: comments } = await supabase
          .from('comments')
          .select(`
            id, content, created_at, upvotes, downvotes,
            author:profiles!author_id(id, username, display_name, avatar),
            post:posts(id, title, community:communities(name))
          `)
          .textSearch('search_vector', query)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        results.comments = comments || []
      }

      // Search users
      if (type === 'all' || type === 'users') {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar, bio, karma, is_verified, role')
          .textSearch('search_vector', query)
          .range(offset, offset + limit - 1)

        results.users = users || []
      }

      // Search communities
      if (type === 'all' || type === 'communities') {
        const { data: communities } = await supabase
          .from('communities')
          .select('id, name, display_name, description, member_count, category')
          .textSearch('search_vector', query)
          .range(offset, offset + limit - 1)

        results.communities = communities || []
      }

      // Search officials
      if (type === 'all' || type === 'officials') {
        const { data: officials } = await supabase
          .from('officials')
          .select('id, name, position, level, constituency, county, party, photo_url')
          .textSearch('search_vector', query)
          .range(offset, offset + limit - 1)

        results.officials = officials || []
      }

      // Search promises
      if (type === 'all' || type === 'promises') {
        const { data: promises } = await supabase
          .from('development_promises')
          .select('id, title, description, status, progress_percentage, official_id')
          .textSearch('search_vector', query)
          .range(offset, offset + limit - 1)

        results.promises = promises || []
      }

      // Search projects
      if (type === 'all' || type === 'projects') {
        const { data: projects } = await supabase
          .from('government_projects')
          .select('id, title, description, status, progress_percentage, county, constituency')
          .textSearch('search_vector', query)
          .range(offset, offset + limit - 1)

        results.projects = projects || []
      }

      return results
    },
    enabled: params.query.length >= 2 // Only search if query is at least 2 characters
  })
}
