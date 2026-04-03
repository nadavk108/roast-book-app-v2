-- Migration: Add session_token for anonymous book creation
-- Allows unauthenticated users to create books before signing in.
-- Books are claimed (user_id set) at payment time.

-- Add session_token column (nullable - anonymous books only)
ALTER TABLE roast_books ADD COLUMN IF NOT EXISTS session_token TEXT;

-- Index for fast session_token lookups (anonymous book retrieval)
CREATE INDEX IF NOT EXISTS idx_roast_books_session_token ON roast_books(session_token);

-- user_id is already nullable (no NOT NULL constraint) - no ALTER needed.
-- Existing rows are unaffected.
