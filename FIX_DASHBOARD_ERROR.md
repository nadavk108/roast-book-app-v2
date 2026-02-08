# Fix Dashboard Error - Add user_id Column

## The Problem

Your dashboard shows "Error loading dashboard" because the `roast_books` table is missing the `user_id` column that tracks which user created each book.

## The Solution (Takes 2 minutes)

### Step 1: Go to Supabase Dashboard

1. Open your browser and go to: https://supabase.com
2. Sign in to your account
3. Click on your project (the one for Roast Book app)

### Step 2: Open SQL Editor

1. In the left sidebar, click on **"SQL Editor"**
2. Click the **"New query"** button (or press `Cmd+K`)

### Step 3: Run the Migration

1. Copy ALL the SQL code below:

```sql
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
```

2. Paste the SQL into the SQL Editor
3. Click the **"Run"** button (or press `Cmd+Enter`)
4. You should see "Success. No rows returned" - that's perfect!

### Step 4: Verify It Worked

1. Go back to your app at `http://localhost:3000/dashboard`
2. Refresh the page (`Cmd+R` or `F5`)
3. The dashboard should now load successfully! 🎉

---

## What This Does

1. **Adds `user_id` column**: Links each roast book to the user who created it
2. **Adds `user_email` column**: Stores user email for easy reference
3. **Creates an index**: Makes user queries fast
4. **Enables Row Level Security (RLS)**: Users can only see their own books
5. **Creates security policies**: Defines what users can do with their books

---

## Temporary Workaround (Already Applied)

I've already updated the dashboard code to handle the missing column gracefully. Until you run the migration:

- ✅ Dashboard will load without errors
- ✅ You can see all books (not filtered by user yet)
- ✅ You can create new books
- ⚠️ All users can see all books (not ideal for production)

After running the migration:
- ✅ Dashboard will load without errors
- ✅ Each user sees ONLY their own books
- ✅ Secure and production-ready

---

## If You Get an Error

### Error: "policy already exists"

This means you already ran part of the migration before. That's okay! Run this instead:

```sql
-- Just add the columns (skip policies)
ALTER TABLE roast_books
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_email TEXT;

CREATE INDEX IF NOT EXISTS idx_roast_books_user_id ON roast_books(user_id);
```

### Error: "column already exists"

This means the migration was already applied successfully. Just refresh your dashboard - it should work now!

---

## Next Steps After Migration

1. **Existing books won't have a user_id**: They'll show up for everyone until you manually assign them
2. **New books will have user_id**: Created automatically from your auth when you make a new book
3. **(Optional) Clean up old books**: You can delete test books from the Table Editor in Supabase

---

## Need Help?

If you're still seeing errors after running the migration:

1. Check the browser console (F12 → Console tab) for errors
2. Check your Supabase project logs (Supabase Dashboard → Logs)
3. Make sure you're using the correct Supabase project

---

**That's it! Your dashboard should work perfectly now.** 🚀
