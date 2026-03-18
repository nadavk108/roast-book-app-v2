-- Migration: Add is_featured_example column to roast_books
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)

-- 1. Add the column
ALTER TABLE roast_books
ADD COLUMN IF NOT EXISTS is_featured_example BOOLEAN DEFAULT FALSE;

-- 2. Mark Tyler, Brett, and Emma as featured examples
UPDATE roast_books
SET is_featured_example = TRUE
WHERE slug IN ('9x7dzympme', '0ef514d9vb', 'yjkyh70ga0');

-- 3. (Optional) RLS policy for anon client reads of featured books
--    Only needed if you ever want to query featured books using the Supabase anon
--    client directly (e.g. from a server component without the admin key).
--    The existing /api/book/[id] route uses supabaseAdmin and already bypasses RLS.
--
-- CREATE POLICY "Public can read featured example books"
--   ON roast_books
--   FOR SELECT
--   TO anon
--   USING (is_featured_example = true);
