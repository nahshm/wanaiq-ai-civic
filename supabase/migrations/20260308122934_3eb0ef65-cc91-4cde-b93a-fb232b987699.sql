
-- Temporarily disable the locked channel deletion guard
ALTER TABLE public.channels DISABLE TRIGGER on_channel_delete;

-- 1. Delete MONITORING channels from non-location communities
DELETE FROM public.channels
WHERE category = 'MONITORING'
  AND community_id IN (
    SELECT id FROM public.communities WHERE type != 'location' OR type IS NULL
  );

-- 2. Delete tier-specific channels (intros, baraza) from non-location communities
DELETE FROM public.channels
WHERE name IN ('intros', 'baraza')
  AND community_id IN (
    SELECT id FROM public.communities WHERE type != 'location' OR type IS NULL
  );

-- Re-enable the trigger
ALTER TABLE public.channels ENABLE TRIGGER on_channel_delete;

-- 3. Add 'resources' channel to interest communities that don't have one
INSERT INTO public.channels (community_id, name, type, category, description, position, emoji_prefix)
SELECT c.id, 'resources', 'text', 'INFO', 'Shared links, guides, and reading material', 2, '📚'
FROM public.communities c
WHERE (c.type != 'location' OR c.type IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.channels ch WHERE ch.community_id = c.id AND ch.name = 'resources'
  );

-- 4. Update seed function to handle both community types
CREATE OR REPLACE FUNCTION public.seed_community_channels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  ELSE
    INSERT INTO public.channels (community_id, name, type, category, description, position, emoji_prefix) VALUES
      (NEW.id, 'community-feed',  'feed',         'FEED',        'Member posts and updates',           1,  '📰'),
      (NEW.id, 'announcements',   'announcement',  'INFO',        'Moderator announcements',           2,  '📢'),
      (NEW.id, 'resources',       'text',          'INFO',        'Shared links, guides, and reading material', 3,  '📚'),
      (NEW.id, 'general-chat',    'text',          'ENGAGEMENT',  'Open discussion',                   4,  '💬'),
      (NEW.id, 'public-forum',    'forum',         'ENGAGEMENT',  'Threaded topic discussions',         5,  '📝')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
