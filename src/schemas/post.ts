import { z } from 'zod';

/**
 * Zod schema for runtime validation of Post data
 */
export const AuthorSchema = z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    avatar: z.string().optional(),
    isVerified: z.boolean().optional().default(false),
    role: z.enum(['citizen', 'official', 'expert', 'journalist']).default('citizen'),
});

export const CommunitySchema = z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string(),
    description: z.string().optional(),
    memberCount: z.number().optional().default(0),
    category: z.enum(['governance', 'civic-education', 'accountability', 'discussion']),
});

export const MediaSchema = z.object({
    id: z.string(),
    url: z.string().url(),
    type: z.enum(['image', 'video', 'document']),
    caption: z.string().optional(),
});

export const PostSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    content: z.string().optional(),
    author: AuthorSchema,
    community: CommunitySchema.optional(),
    createdAt: z.date(),
    upvotes: z.number().default(0),
    downvotes: z.number().default(0),
    commentCount: z.number().default(0),
    userVote: z.enum(['up', 'down']).nullable().default(null),
    tags: z.array(z.string()).default([]),
    contentSensitivity: z.enum(['public', 'sensitive', 'crisis']).default('public'),
    isNgoVerified: z.boolean().default(false),
    media: z.array(MediaSchema).default([]),
});

export type ValidatedPost = z.infer<typeof PostSchema>;
export type ValidatedAuthor = z.infer<typeof AuthorSchema>;
export type ValidatedCommunity = z.infer<typeof CommunitySchema>;
export type ValidatedMedia = z.infer<typeof MediaSchema>;

/**
 * Safely parse and validate post data
 * Returns null if validation fails
 */
export function validatePost(data: unknown): ValidatedPost | null {
    const result = PostSchema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    if (import.meta.env.DEV) {
        console.warn('Post validation failed:', result.error.issues);
    }
    return null;
}

/**
 * Validate an array of posts, filtering out invalid ones
 */
export function validatePosts(data: unknown[]): ValidatedPost[] {
    return data
        .map(item => validatePost(item))
        .filter((post): post is ValidatedPost => post !== null);
}
