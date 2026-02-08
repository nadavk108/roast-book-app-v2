-- The Roast Book - Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Create roast_books table
CREATE TABLE IF NOT EXISTS roast_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  victim_name TEXT NOT NULL,
  victim_image_url TEXT NOT NULL,
  victim_description TEXT,
  victim_gender TEXT DEFAULT 'neutral',
  quotes TEXT[] NOT NULL DEFAULT '{}',
  custom_greeting TEXT,
  status TEXT NOT NULL DEFAULT 'analyzing',
  preview_image_urls TEXT[] NOT NULL DEFAULT '{}',
  full_image_urls TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  CONSTRAINT status_check CHECK (status IN ('analyzing', 'preview_ready', 'paid', 'complete', 'failed'))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_roast_books_slug ON roast_books(slug);
CREATE INDEX IF NOT EXISTS idx_roast_books_stripe_session ON roast_books(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_roast_books_status ON roast_books(status);
CREATE INDEX IF NOT EXISTS idx_roast_books_created_at ON roast_books(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE roast_books ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
  ON roast_books
  FOR SELECT
  USING (true);

-- Create policy to allow public insert
CREATE POLICY "Allow public insert"
  ON roast_books
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow public update
CREATE POLICY "Allow public update"
  ON roast_books
  FOR UPDATE
  USING (true);

-- STORAGE BUCKET SETUP
-- You need to create this manually in Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create New Bucket
-- 3. Name: roast-books
-- 4. Public bucket: YES
-- 5. File size limit: 50MB
-- 6. Allowed MIME types: image/*

-- Alternatively, run this (requires supabase-js admin client):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('roast-books', 'roast-books', true);

-- Storage policies
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Allow public uploads', 'roast-books', '{"role": "public"}'),
  ('Allow public downloads', 'roast-books', '{"role": "public"}')
ON CONFLICT DO NOTHING;
