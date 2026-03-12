-- Create communities table for civic engagement
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('governance', 'civic-education', 'accountability', 'discussion')),
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table for user discussions
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  community_id UUID REFERENCES public.communities(id),
  official_id UUID REFERENCES public.officials(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table for posts and comments
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK ((post_id IS NULL) != (comment_id IS NULL)) -- Ensures exactly one is set
);

-- Create community_members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, community_id)
);

-- Enable Row Level Security
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
CREATE POLICY "Communities are viewable by everyone" 
ON public.communities FOR SELECT USING (true);

-- RLS Policies for posts
CREATE POLICY "Posts are viewable by everyone" 
ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = author_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" 
ON public.comments FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = author_id);

-- RLS Policies for votes
CREATE POLICY "Users can view all votes" 
ON public.votes FOR SELECT USING (true);

CREATE POLICY "Users can create their own votes" 
ON public.votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.votes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.votes FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for community members
CREATE POLICY "Community members are viewable by everyone" 
ON public.community_members FOR SELECT USING (true);

CREATE POLICY "Users can join communities" 
ON public.community_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" 
ON public.community_members FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key constraints with proper references
ALTER TABLE public.posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.votes 
ADD CONSTRAINT votes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create update triggers
CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON public.communities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample communities
INSERT INTO public.communities (name, display_name, description, category) VALUES
('governance', 'National Governance', 'Discussions about national government policies and decisions', 'governance'),
('county-governance', 'County Governance', 'Local county government discussions and accountability', 'governance'),
('civic-education', 'Civic Education', 'Learn about your rights, duties, and how government works', 'civic-education'),
('accountability', 'Government Accountability', 'Track promises, report issues, and hold officials accountable', 'accountability'),
('public-services', 'Public Services', 'Discuss healthcare, education, infrastructure and other public services', 'discussion'),
('youth-engagement', 'Youth in Governance', 'Empowering young Kenyans to participate in civic activities', 'discussion');

-- Update member counts (will be updated by triggers in real implementation)
UPDATE public.communities SET member_count = FLOOR(RANDOM() * 1000) + 100;