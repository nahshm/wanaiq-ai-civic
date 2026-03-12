
-- Fix: Standardize MONITORING channel types to 'text' (they use name-based routing)
UPDATE public.channels
SET type = 'text'
WHERE name IN ('our-leaders', 'projects-watch', 'promises-watch')
  AND type != 'text';

-- Fix: Update seed function to use correct types
CREATE OR REPLACE FUNCTION public.seed_community_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only seed for location-type communities
  IF NEW.type = 'location' THEN
    INSERT INTO public.channels (community_id, name, type, category, description, position, emoji_prefix) VALUES
      (NEW.id, 'community-feed',  'feed',         'FEED',        'Community feed',                    1,  '📰'),
      (NEW.id, 'intros',          'text',          'INFO',        'Introduce yourself',                2,  '👋'),
      (NEW.id, 'announcements',   'announcement',  'INFO',        'Official announcements',            3,  '📢'),
      (NEW.id, 'our-leaders',     'text',          'MONITORING',  'Track your elected leaders',         4,  '👤'),
      (NEW.id, 'projects-watch',  'text',          'MONITORING',  'Monitor government projects',        5,  '🏗️'),
      (NEW.id, 'promises-watch',  'text',          'MONITORING',  'Track campaign promises',            6,  '📋'),
      (NEW.id, 'project-tracker', 'forum',         'MONITORING',  'Discuss and track projects',         7,  '📊'),
      (NEW.id, 'general-chat',    'text',          'ENGAGEMENT',  'General community discussion',       8,  '💬'),
      (NEW.id, 'baraza',          'video',         'ENGAGEMENT',  'Community town hall',                9,  '🎙️'),
      (NEW.id, 'public-forum',    'forum',         'ENGAGEMENT',  'Open community forum',              10, '📝')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
