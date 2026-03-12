-- Add full-text search capabilities to WanaIQ platform
-- Migration: Add search indexes for posts, comments, profiles, communities, officials, promises, and projects
-- Using TRIGGER approach instead of GENERATED ALWAYS (to_tsvector is not immutable)

-- ============================================================================
-- 1. POSTS TABLE - Full-Text Search
-- ============================================================================

-- Add tsvector column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create trigger function
CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS posts_search_vector_trigger ON posts;
CREATE TRIGGER posts_search_vector_trigger
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

-- Update existing rows
UPDATE posts SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN (search_vector);

-- Create additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);

-- ============================================================================
-- 2. COMMENTS TABLE - Full-Text Search
-- ============================================================================

ALTER TABLE comments ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION comments_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_search_vector_trigger ON comments;
CREATE TRIGGER comments_search_vector_trigger
BEFORE INSERT OR UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION comments_search_vector_update();

UPDATE comments SET search_vector = to_tsvector('english', coalesce(content, ''));

CREATE INDEX IF NOT EXISTS idx_comments_search ON comments USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);

-- ============================================================================
-- 3. PROFILES TABLE (USERS) - Full-Text Search
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION profiles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_search_vector_trigger ON profiles;
CREATE TRIGGER profiles_search_vector_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION profiles_search_vector_update();

UPDATE profiles SET search_vector = 
  setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'B');

CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================================================
-- 4. COMMUNITIES TABLE - Full-Text Search
-- ============================================================================

ALTER TABLE communities ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION communities_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS communities_search_vector_trigger ON communities;
CREATE TRIGGER communities_search_vector_trigger
BEFORE INSERT OR UPDATE ON communities
FOR EACH ROW EXECUTE FUNCTION communities_search_vector_update();

UPDATE communities SET search_vector = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B');

CREATE INDEX IF NOT EXISTS idx_communities_search ON communities USING GIN (search_vector);

-- ============================================================================
-- 5. OFFICIALS TABLE - Full-Text Search
-- ============================================================================

ALTER TABLE officials ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION officials_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.position, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.constituency, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.county, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS officials_search_vector_trigger ON officials;
CREATE TRIGGER officials_search_vector_trigger
BEFORE INSERT OR UPDATE ON officials
FOR EACH ROW EXECUTE FUNCTION officials_search_vector_update();

UPDATE officials SET search_vector = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(position, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(constituency, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(county, '')), 'B');

CREATE INDEX IF NOT EXISTS idx_officials_search ON officials USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_officials_level ON officials(level);

-- ============================================================================
-- 6. DEVELOPMENT_PROMISES TABLE - Full-Text Search
-- ============================================================================

ALTER TABLE development_promises ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION development_promises_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS development_promises_search_vector_trigger ON development_promises;
CREATE TRIGGER development_promises_search_vector_trigger
BEFORE INSERT OR UPDATE ON development_promises
FOR EACH ROW EXECUTE FUNCTION development_promises_search_vector_update();

UPDATE development_promises SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C');

CREATE INDEX IF NOT EXISTS idx_promises_search ON development_promises USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_promises_status ON development_promises(status);
CREATE INDEX IF NOT EXISTS idx_promises_official ON development_promises(official_id);

-- ============================================================================
-- 7. GOVERNMENT_PROJECTS TABLE - Full-Text Search
-- ============================================================================

ALTER TABLE government_projects ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION government_projects_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.county, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.constituency, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS government_projects_search_vector_trigger ON government_projects;
CREATE TRIGGER government_projects_search_vector_trigger
BEFORE INSERT OR UPDATE ON government_projects
FOR EACH ROW EXECUTE FUNCTION government_projects_search_vector_update();

UPDATE government_projects SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(county, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(constituency, '')), 'C');

CREATE INDEX IF NOT EXISTS idx_projects_search ON government_projects USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_projects_status ON government_projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_county ON government_projects(county);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN posts.search_vector IS 'Full-text search vector for post title, content, and tags (trigger-maintained)';
COMMENT ON COLUMN comments.search_vector IS 'Full-text search vector for comment content (trigger-maintained)';
COMMENT ON COLUMN profiles.search_vector IS 'Full-text search vector for username, display name, and bio (trigger-maintained)';
COMMENT ON COLUMN communities.search_vector IS 'Full-text search vector for community name and description (trigger-maintained)';
COMMENT ON COLUMN officials.search_vector IS 'Full-text search vector for official name, position, and location (trigger-maintained)';
COMMENT ON COLUMN development_promises.search_vector IS 'Full-text search vector for promise title, description, and location (trigger-maintained)';
COMMENT ON COLUMN government_projects.search_vector IS 'Full-text search vector for project title, description, and location (trigger-maintained)';
