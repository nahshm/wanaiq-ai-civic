-- Migration: Add Baraza tables with UUID primary keys
-- Date: 2025-09-30

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Baraza Spaces table
CREATE TABLE IF NOT EXISTS baraza_spaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id varchar(64) UNIQUE NOT NULL,
    title varchar(255) NOT NULL,
    description text,
    host_user_id varchar(64) NOT NULL,
    is_live boolean DEFAULT TRUE,
    created_at timestamptz DEFAULT now(),
    ended_at timestamptz
);

-- Baraza Participants table
CREATE TABLE IF NOT EXISTS baraza_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id uuid NOT NULL,
    user_id varchar(64) NOT NULL,
    role varchar(20) DEFAULT 'listener', -- host, speaker, listener
    joined_at timestamptz DEFAULT now(),
    left_at timestamptz,
    FOREIGN KEY (space_id) REFERENCES baraza_spaces(id) ON DELETE CASCADE
);

-- Baraza Recordings table
CREATE TABLE IF NOT EXISTS baraza_recordings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id uuid NOT NULL,
    recording_url varchar(500) NOT NULL,
    duration_seconds integer,
    file_size_bytes bigint,
    created_at timestamptz DEFAULT now(),
    FOREIGN KEY (space_id) REFERENCES baraza_spaces(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_baraza_spaces_space_id ON baraza_spaces(space_id);
CREATE INDEX IF NOT EXISTS idx_baraza_spaces_host_user_id ON baraza_spaces(host_user_id);
CREATE INDEX IF NOT EXISTS idx_baraza_spaces_is_live ON baraza_spaces(is_live);
CREATE INDEX IF NOT EXISTS idx_baraza_participants_space_id ON baraza_participants(space_id);
CREATE INDEX IF NOT EXISTS idx_baraza_participants_user_id ON baraza_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_baraza_recordings_space_id ON baraza_recordings(space_id);
