-- Migration: Fix users table to work with Supabase Auth
-- Purpose: Remove custom users table and update foreign keys to reference auth.users
-- Module: 3x1 - Supabase Auth Implementation

-- ============================================================================
-- DROP OLD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Drop foreign keys from dependent tables
ALTER TABLE flashcards DROP CONSTRAINT IF EXISTS flashcards_user_id_fkey;
ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_user_id_fkey;
ALTER TABLE generation_error_logs DROP CONSTRAINT IF EXISTS generation_error_logs_user_id_fkey;

-- ============================================================================
-- DROP CUSTOM USERS TABLE
-- ============================================================================

-- Drop the custom users table as we'll use auth.users instead
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- ADD NEW FOREIGN KEY CONSTRAINTS TO auth.users
-- ============================================================================

-- Add foreign keys referencing auth.users (Supabase's built-in auth table)
ALTER TABLE flashcards
ADD CONSTRAINT flashcards_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE generations
ADD CONSTRAINT generations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE generation_error_logs
ADD CONSTRAINT generation_error_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- NOTES
-- ============================================================================

-- auth.users is Supabase's built-in authentication table
-- It's automatically managed by Supabase Auth
-- When users sign up via Supabase Auth, they're automatically added to auth.users
-- Using auth.users directly eliminates the need for custom user management
