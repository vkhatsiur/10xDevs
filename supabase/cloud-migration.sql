-- ============================================================================
-- 10xCards Cloud Database Setup
-- Combined migration for E2E testing environment
-- ============================================================================

-- Note: auth.users already exists in Supabase, so we skip custom users table

-- ============================================================================
-- TABLES
-- ============================================================================

-- Generations table
CREATE TABLE IF NOT EXISTS generations (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
    id bigserial PRIMARY KEY,
    front varchar(200) NOT NULL,
    back varchar(500) NOT NULL,
    source varchar NOT NULL CHECK (source IN ('ai-full', 'ai-edited', 'manual')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    generation_id bigint REFERENCES generations(id) ON DELETE SET NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Generation error logs table
CREATE TABLE IF NOT EXISTS generation_error_logs (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Flashcards indexes
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_generation_id ON flashcards(generation_id);

-- Generations indexes
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);

-- Generation error logs indexes
CREATE INDEX IF NOT EXISTS idx_generation_error_logs_user_id ON generation_error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_error_logs_created_at ON generation_error_logs(created_at);

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
DROP TRIGGER IF EXISTS set_timestamp_flashcards ON flashcards;
CREATE TRIGGER set_timestamp_flashcards
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Trigger for generations.updated_at
DROP TRIGGER IF EXISTS set_timestamp_generations ON generations;
CREATE TRIGGER set_timestamp_generations
BEFORE UPDATE ON generations
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on flashcards table
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Enable RLS on generations table
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on generation_error_logs table
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FLASHCARDS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can update their own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can delete their own flashcards" ON flashcards;

-- Policy: Users can view only their own flashcards
CREATE POLICY "Users can view their own flashcards"
ON flashcards
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own flashcards
CREATE POLICY "Users can insert their own flashcards"
ON flashcards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own flashcards
CREATE POLICY "Users can update their own flashcards"
ON flashcards
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own flashcards
CREATE POLICY "Users can delete their own flashcards"
ON flashcards
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- GENERATIONS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own generations" ON generations;
DROP POLICY IF EXISTS "Users can insert their own generations" ON generations;
DROP POLICY IF EXISTS "Users can update their own generations" ON generations;
DROP POLICY IF EXISTS "Users can delete their own generations" ON generations;

-- Policy: Users can view only their own generations
CREATE POLICY "Users can view their own generations"
ON generations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own generations
CREATE POLICY "Users can insert their own generations"
ON generations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own generations
CREATE POLICY "Users can update their own generations"
ON generations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own generations
CREATE POLICY "Users can delete their own generations"
ON generations
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- GENERATION_ERROR_LOGS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own error logs" ON generation_error_logs;
DROP POLICY IF EXISTS "Users can insert their own error logs" ON generation_error_logs;

-- Policy: Users can view only their own error logs
CREATE POLICY "Users can view their own error logs"
ON generation_error_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own error logs
CREATE POLICY "Users can insert their own error logs"
ON generation_error_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE flashcards IS 'Individual flashcards (AI-generated or manual)';
COMMENT ON TABLE generations IS 'AI generation sessions with statistics';
COMMENT ON TABLE generation_error_logs IS 'Error logs for failed AI generations';

COMMENT ON COLUMN flashcards.source IS 'Origin: ai-full (unedited AI), ai-edited (edited AI), manual (user-created)';
COMMENT ON COLUMN generations.source_text_hash IS 'SHA-256 hash of source text (privacy)';
COMMENT ON COLUMN generations.source_text_length IS 'Length of source text in characters';
COMMENT ON COLUMN generations.generation_duration IS 'Generation time in milliseconds';

-- ============================================================================
-- DONE!
-- ============================================================================
