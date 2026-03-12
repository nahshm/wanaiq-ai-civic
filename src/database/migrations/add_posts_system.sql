-- Posts System Tables Migration
-- Run this after the enhanced_security.sql migration

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar TEXT,
    is_verified BOOLEAN DEFAULT 0,
    role TEXT DEFAULT 'citizen',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    member_count INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    author_id TEXT NOT NULL,
    community_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tags TEXT, -- JSON array stored as text
    flair TEXT,
    content_type TEXT DEFAULT 'text',
    link_url TEXT,
    poll_options TEXT, -- JSON array stored as text
    FOREIGN KEY (author_id) REFERENCES users (id),
    FOREIGN KEY (community_id) REFERENCES communities (id)
);

-- Post media files table
CREATE TABLE IF NOT EXISTS post_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    parent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0,
    moderation_status TEXT DEFAULT 'approved',
    FOREIGN KEY (author_id) REFERENCES users (id),
    FOREIGN KEY (post_id) REFERENCES posts (id),
    FOREIGN KEY (parent_id) REFERENCES comments (id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);
