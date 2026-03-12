/**
 * Profile Security Utilities
 * 
 * Handles field-level access control for user profiles to prevent
 * exposure of sensitive personal information to non-owners.
 */

/**
 * Fields that are safe to expose publicly (to any authenticated user)
 */
export const PUBLIC_PROFILE_FIELDS = [
  'id',
  'username',
  'display_name',
  'avatar_url',
  'banner_url',
  'bio',
  'role',
  'is_verified',
  'karma',
  'post_karma',
  'comment_karma',
  'badges',
  'created_at',
  'updated_at',
  'official_position',
  'official_position_id',
  // Geographic region (not precise location)
  'county',
  'constituency', 
  'ward',
  // Public stats
  'followers_count',
  'following_count',
] as const;

/**
 * Fields that should only be accessible to the profile owner
 * These contain potentially sensitive personal information
 */
export const PRIVATE_PROFILE_FIELDS = [
  'social_links',      // May contain email, phone, personal links
  'location',          // Precise location text
  'expertise',         // Professional information
  'website',           // Personal website
  'email',             // Email address
  'phone',             // Phone number
  'privacy_settings',  // Internal settings
  'is_private',        // Privacy flag
  'activity_stats',    // Activity tracking data
  'last_activity',     // Activity tracking data
  'onboarding_completed',
  'persona',
  // UUID reference fields (internal)
  'county_id',
  'constituency_id',
  'ward_id',
] as const;

/**
 * Build a select string for profile queries based on whether
 * the requester is the profile owner
 * 
 * @param isOwner - Whether the requester owns the profile
 * @param additionalFields - Extra fields to include (e.g., relations)
 * @returns Select string for Supabase query
 */
export function getProfileSelectFields(
  isOwner: boolean,
  additionalFields: string[] = []
): string {
  if (isOwner) {
    // Owner gets all fields
    return '*' + (additionalFields.length ? ', ' + additionalFields.join(', ') : '');
  }
  
  // Non-owner gets only public fields
  const fields = [...PUBLIC_PROFILE_FIELDS, ...additionalFields];
  return fields.join(', ');
}

/**
 * Strip sensitive fields from a profile object (client-side protection)
 * Use this as a fallback when the query already fetched all fields
 * 
 * @param profile - The profile object
 * @param isOwner - Whether the requester owns the profile
 * @returns Profile with sensitive fields removed for non-owners
 */
export function sanitizeProfileData<T extends Record<string, unknown>>(
  profile: T,
  isOwner: boolean
): T {
  if (isOwner || !profile) {
    return profile;
  }
  
  // Create a copy and remove private fields
  const sanitized = { ...profile };
  
  for (const field of PRIVATE_PROFILE_FIELDS) {
    delete sanitized[field];
  }
  
  return sanitized;
}

/**
 * Check if a user can view another user's sensitive profile information
 * This considers privacy settings if available
 * 
 * @param profile - The profile being viewed
 * @param viewerId - The ID of the user viewing the profile
 * @returns Whether sensitive fields should be visible
 */
export function canViewSensitiveFields(
  profile: { id: string; is_private?: boolean; privacy_settings?: Record<string, unknown> },
  viewerId: string | null | undefined
): boolean {
  // Owner can always see their own data
  if (viewerId && profile.id === viewerId) {
    return true;
  }
  
  // Private profiles hide sensitive data
  if (profile.is_private) {
    return false;
  }
  
  // Check granular privacy settings if available
  const settings = profile.privacy_settings;
  if (settings) {
    // If any field is explicitly hidden, we're cautious
    return false;
  }
  
  // Default: non-owners cannot see sensitive fields
  return false;
}
