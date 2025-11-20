-- Migration: Enable Row Level Security (RLS)
-- Purpose: Implement data isolation per user for authentication
-- Module: 3x1 - Supabase Auth Implementation

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
-- SECURITY NOTES
-- ============================================================================

-- These policies implement the following security levels:
--
-- 1. Database-level isolation via RLS
-- 2. JWT-based authentication (auth.uid() from Supabase Auth)
-- 3. Per-row access control (users can only access their own data)
-- 4. Error logs are protected through generation ownership
--
-- The auth.uid() function returns the authenticated user's UUID from
-- the JWT token, ensuring all queries are automatically filtered by user.
