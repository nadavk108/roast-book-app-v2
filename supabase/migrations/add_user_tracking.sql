-- Add user tracking columns to roast_books table
ALTER TABLE roast_books
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_roast_books_user_id ON roast_books(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE roast_books ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own books
CREATE POLICY "Users can view own books"
  ON roast_books
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own books
CREATE POLICY "Users can create own books"
  ON roast_books
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own books
CREATE POLICY "Users can update own books"
  ON roast_books
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own books
CREATE POLICY "Users can delete own books"
  ON roast_books
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: Service role bypasses RLS, so API routes using supabaseAdmin will still work
