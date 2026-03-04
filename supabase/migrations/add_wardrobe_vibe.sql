-- Add wardrobe_vibe column to roast_books table
-- Stores a persona-driven style guide for outfit generation in image prompts
-- Run this in your Supabase SQL Editor

ALTER TABLE roast_books
ADD COLUMN IF NOT EXISTS wardrobe_vibe TEXT DEFAULT NULL;
