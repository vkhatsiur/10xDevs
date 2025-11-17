-- 10xCards Database Schema
-- Based on 10xDevs course structure
-- Version: 1.0
-- Date: 2025-11-17

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (managed by Supabase Auth)
CREATE TABLE users (
    id uuid PRIMARY KEY,
    email varchar(255) UNIQUE NOT NULL,
    encrypted_password varchar NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    confirmed_at timestamptz
);

-- Flashcards table
CREATE TABLE flashcards (
    id bigserial PRIMARY KEY,
    front varchar(200) NOT NULL,
    back varchar(500) NOT NULL,
    source varchar NOT NULL CHECK (source IN ('ai-full', 'ai-edited', 'manual')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    generation_id bigint REFERENCES generations(id) ON DELETE SET NULL,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Generations table
CREATE TABLE generations (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model varchar NOT NULL,
    generated_count integer NOT NULL,
    accepted_unedited_count integer,
    accepted_edited_count integer,
    source_text_hash varchar NOT NULL,
    source_text_length integer NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000),
    generation_duration integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Generation error logs table
CREATE TABLE generation_error_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model varchar NOT NULL,
    source_text_hash varchar NOT NULL,
    source_text_length integer NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000),
    error_code varchar(100) NOT NULL,
    error_message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Flashcards indexes
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);

-- Generations indexes
CREATE INDEX idx_generations_user_id ON generations(user_id);

-- Generation error logs indexes
CREATE INDEX idx_generation_error_logs_user_id ON generation_error_logs(user_id);
CREATE INDEX idx_generation_error_logs_created_at ON generation_error_logs(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for flashcards.updated_at
CREATE TRIGGER set_timestamp_flashcards
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Trigger for generations.updated_at
CREATE TRIGGER set_timestamp_generations
BEFORE UPDATE ON generations
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts (managed by Supabase Auth)';
COMMENT ON TABLE flashcards IS 'Individual flashcards (AI-generated or manual)';
COMMENT ON TABLE generations IS 'AI generation sessions with statistics';
COMMENT ON TABLE generation_error_logs IS 'Error logs for failed AI generations';

COMMENT ON COLUMN flashcards.source IS 'Origin: ai-full (unedited AI), ai-edited (edited AI), manual (user-created)';
COMMENT ON COLUMN generations.source_text_hash IS 'SHA-256 hash of source text (privacy)';
COMMENT ON COLUMN generations.source_text_length IS 'Length of source text in characters';
COMMENT ON COLUMN generations.generation_duration IS 'Generation time in milliseconds';

-- ============================================================================
-- SAMPLE DATA (For Development)
-- ============================================================================

-- Insert test user
-- Note: In production, users are managed by Supabase Auth
-- For MVP testing, we create a manual user
INSERT INTO users (id, email, encrypted_password, created_at, confirmed_at) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'test@10xcards.com',
    'encrypted_password_placeholder',
    now(),
    now()
);

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. RLS (Row Level Security) will be enabled in Module 3
-- 2. User authentication fully integrated with Supabase Auth in Module 3
-- 3. This schema prioritizes:
--    - Performance (BIGSERIAL for high-frequency tables)
--    - Privacy (hashing source text)
--    - Analytics (tracking AI effectiveness)
--    - Error monitoring (comprehensive error logging)
