/**
 * Profile link builder — single source of truth for generating user profile URLs.
 *
 * Replaces scattered hardcoded `/u/:username` links across the codebase.
 *
 * Prefix semantics:
 *   /u/ = Regular citizen
 *   /w/ = Verified/trusted platform user (journalist, expert, community leader)
 *   /g/ = Government official (has office position)
 *
 * Usage:
 *   import { buildProfileLink } from '@/lib/profile-links';
 *   <Link to={buildProfileLink(author)}>@{author.username}</Link>
 */

interface ProfileLinkInput {
    username: string;
    is_verified?: boolean | null;
    official_position?: string | null;
    official_position_id?: string | null;
}

/**
 * Returns the correct profile URL for a user based on their trust level.
 * Falls back to /u/ for unknown/unverified users.
 */
export function buildProfileLink(profile: ProfileLinkInput): string {
    if (!profile.username) return '/';

    // Government officials always get /g/ prefix
    if (profile.official_position || profile.official_position_id) {
        return `/g/${profile.username}`;
    }

    // Verified/trusted platform users get /w/ prefix
    if (profile.is_verified) {
        return `/w/${profile.username}`;
    }

    // Default: regular citizen
    return `/u/${profile.username}`;
}

/**
 * Returns just the prefix character ('u' | 'w' | 'g') for a given user.
 * Useful when you need to construct URLs or perform prefix-based logic.
 */
export function getProfilePrefix(profile: ProfileLinkInput): 'u' | 'w' | 'g' {
    if (profile.official_position || profile.official_position_id) return 'g';
    if (profile.is_verified) return 'w';
    return 'u';
}
