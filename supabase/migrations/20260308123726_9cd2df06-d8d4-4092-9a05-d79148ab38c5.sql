
-- 1. Add intros and baraza to interest communities that don't have them
INSERT INTO public.channels (community_id, name, type, category, description, position, emoji_prefix)
SELECT c.id, 'intros', 'text', 'INFO', 'Introduce yourself', 3, '👋'
FROM public.communities c
WHERE (c.type != 'location' OR c.type IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.channels ch WHERE ch.community_id = c.id AND ch.name = 'intros'
  );

INSERT INTO public.channels (community_id, name, type, category, description, position, emoji_prefix)
SELECT c.id, 'baraza', 'video', 'ENGAGEMENT', 'Community town hall', 6, '🎙️'
FROM public.communities c
WHERE (c.type != 'location' OR c.type IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.channels ch WHERE ch.community_id = c.id AND ch.name = 'baraza'
  );

-- 2. Update seed function to include intros and baraza for interest communities
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
      (NEW.id, 'intros',          'text',          'INFO',        'Introduce yourself',                3,  '👋'),
      (NEW.id, 'resources',       'text',          'INFO',        'Shared links, guides, and reading material', 4,  '📚'),
      (NEW.id, 'general-chat',    'text',          'ENGAGEMENT',  'Open discussion',                   5,  '💬'),
      (NEW.id, 'public-forum',    'forum',         'ENGAGEMENT',  'Threaded topic discussions',         6,  '📝'),
      (NEW.id, 'baraza',          'video',         'ENGAGEMENT',  'Community town hall',                7,  '🎙️')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
