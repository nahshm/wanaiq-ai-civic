-- Community Bookmarks Table
-- Stores useful links/resources for each community

-- Drop existing table if it exists with wrong schema
DROP TABLE IF EXISTS community_bookmarks CASCADE;

CREATE TABLE community_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT DEFAULT 'link', -- lucide icon name
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_community_bookmarks_community 
ON community_bookmarks(community_id, position);

-- Enable RLS
ALTER TABLE community_bookmarks ENABLE ROW LEVEL SECURITY;

-- Anyone can view bookmarks
CREATE POLICY "View community bookmarks"
ON community_bookmarks FOR SELECT
USING (true);

-- Admins can manage bookmarks
CREATE POLICY "Admins can manage bookmarks"
ON community_bookmarks FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM community_moderators
        WHERE community_id = community_bookmarks.community_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM community_moderators
        WHERE community_id = community_bookmarks.community_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
);
