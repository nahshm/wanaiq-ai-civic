
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface UserContext {
  // Identity
  userId: string;
  name: string;
  role: string;
  verifiedRole: boolean;
  
  // Location
  location: {
    county: string;
    constituency?: string;
    ward?: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Interests & Preferences
  interests: string[];
  expertiseAreas: string[];
  preferredLanguage: string;
  
  // Activity Patterns
  activity: {
    issuesReportedRecently: number;
    issueTypesReported: string[];
    promisesTracked: number;
    postsCreated: number;
    commentsCreated: number;
    followingPoliticians: string[];
    mostActiveCategory?: string;
  };
  
  // Engagement
  engagementScore: number;
  totalContributions: number;
  lastActive: Date;
}

/**
 * Gather user context for AI personalization from actual database schema.
 * Reads from: profiles, user_interests + civic_interests
 */
export async function getUserContext(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext> {

  // Parallel queries: profile + interests
  const [profileResult, interestsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        county,
        constituency,
        ward,
        role,
        persona,
        is_verified,
        expertise,
        karma,
        last_activity
      `)
      .eq('id', userId)
      .single(),

    // Get interest display names via user_interests -> civic_interests
    supabase
      .from('user_interests')
      .select('civic_interests ( display_name )')
      .eq('user_id', userId)
  ]);

  const profile = profileResult.data;
  if (!profile) {
    throw new Error('User profile not found');
  }

  // Extract interest names from the joined result
  const interests: string[] = (interestsResult.data || [])
    .map((row: any) => row.civic_interests?.display_name)
    .filter(Boolean);

  // Use persona (from onboarding) as the AI role if available, fallback to generic role
  const effectiveRole = profile.persona || profile.role || 'citizen';

  const context: UserContext = {
    userId,
    name: profile.display_name || 'Citizen',
    role: effectiveRole,
    verifiedRole: profile.is_verified || false,

    location: {
      county: profile.county || 'Kenya',
      constituency: profile.constituency || undefined,
      ward: profile.ward || undefined,
    },

    interests,
    expertiseAreas: profile.expertise || [],
    preferredLanguage: 'en',

    // No activity summary table exists yet — defaults
    activity: {
      issuesReportedRecently: 0,
      issueTypesReported: [],
      promisesTracked: 0,
      postsCreated: 0,
      commentsCreated: 0,
      followingPoliticians: [],
    },

    engagementScore: profile.karma || 0,
    totalContributions: 0,
    lastActive: new Date(profile.last_activity || Date.now()),
  };

  return context;
}
