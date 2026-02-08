-- Add victim_gender column to existing roast_books table
-- Run this in your Supabase SQL Editor

ALTER TABLE roast_books
ADD COLUMN IF NOT EXISTS victim_gender TEXT DEFAULT 'neutral';

-- Update any existing NULL values to 'neutral'
UPDATE roast_books
SET victim_gender = 'neutral'
WHERE victim_gender IS NULL;
