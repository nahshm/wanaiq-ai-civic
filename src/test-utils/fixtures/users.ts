import { User } from '@supabase/supabase-js';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { username: 'testuser' },
  ...overrides,
});

export const createMockProfile = (overrides?: Record<string, any>) => ({
  id: 'test-user-id-123',
  username: 'testuser',
  display_name: 'Test User',
  avatar_url: 'https://example.com/avatar.png',
  bio: 'Test bio',
  role: 'citizen',
  is_verified: false,
  created_at: new Date().toISOString(),
  karma: 100,
  post_karma: 50,
  comment_karma: 50,
  badges: ['newcomer'],
  location: 'Nairobi',
  website: null,
  social_links: {},
  expertise: ['civic'],
  is_private: false,
  privacy_settings: {},
  activity_stats: {},
  last_activity: new Date().toISOString(),
  onboarding_completed: true,
  ...overrides,
});

export const createMockSession = (overrides?: Record<string, any>) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: createMockUser(),
  ...overrides,
});
