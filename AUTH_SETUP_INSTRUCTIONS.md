# Authentication Setup Instructions

## ✅ What Has Been Implemented

All the code for Google authentication has been implemented:

1. **Supabase Client Setup** (`lib/supabase-browser.ts`, `lib/supabase-server.ts`)
2. **Auth Utilities** (`lib/auth.ts`)
3. **Login Page** (`app/login/page.tsx`) - Neo-brutalist design with Google sign-in
4. **OAuth Callback Handler** (`app/auth/callback/route.ts`)
5. **Authentication Middleware** (`middleware.ts`) - Protects /create, /preview, /book, /dashboard routes
6. **Updated Header** with user session, avatar, and dropdown menu
7. **User Tracking** in book creation (stores user_id and user_email)
8. **Dashboard Filtering** to show only the logged-in user's books
9. **Database Migration SQL** (`supabase/migrations/add_user_tracking.sql`)

---

## 🚨 MANUAL STEPS REQUIRED

You need to complete these steps in your Supabase Dashboard:

### Step 1: Run Database Migration

Go to your Supabase project → SQL Editor → New Query

Paste and run this SQL:

\`\`\`sql
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
\`\`\`

**Note:** The service role (used in API routes via `supabaseAdmin`) bypasses RLS, so API routes will continue to work.

---

### Step 2: Create Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials
   - Select your project (or create a new one)

2. **Create OAuth 2.0 Client ID:**
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "The Roast Book"

3. **Add Authorized Redirect URIs:**
   - Find your Supabase project reference ID from your Supabase URL
   - Add this redirect URI:
     \`\`\`
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     \`\`\`
   - Example: `https://supymlyoquwzhpbqjdxl.supabase.co/auth/v1/callback`

4. **Copy Credentials:**
   - Client ID: (starts with something like `123456-abcdef.apps.googleusercontent.com`)
   - Client Secret: (random string)

---

### Step 3: Configure Google Provider in Supabase

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]

2. **Navigate to Authentication → Providers**

3. **Enable Google Provider:**
   - Find "Google" in the list
   - Toggle "Enable Sign in with Google"

4. **Enter OAuth Credentials:**
   - Paste your Google Client ID
   - Paste your Google Client Secret
   - Click "Save"

---

### Step 4: Verify Environment Variables

Check your `.env.local` file has these variables:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3001
\`\`\`

If deploying to production, update `NEXT_PUBLIC_APP_URL` to your production URL.

---

## 🧪 Testing the Authentication Flow

### 1. Test Sign In
```bash
npm run dev
```

1. Navigate to: http://localhost:3001/login
2. Click "Sign in with Google"
3. Google OAuth popup should appear
4. Authorize the app
5. Should redirect to `/dashboard`
6. Header should show your avatar and name

### 2. Test Protected Routes
1. Sign out (click dropdown in header → Sign Out)
2. Try to visit: http://localhost:3001/dashboard
3. Should redirect to `/login?redirect=/dashboard`
4. Sign in again
5. Should redirect back to `/dashboard`

### 3. Test Book Creation with User Tracking
1. Sign in
2. Go to `/dashboard`
3. Click "New Roast Book"
4. Upload a photo and create a book
5. Check Supabase database:
   - Open Table Editor → roast_books
   - Find your new book
   - Verify `user_id` and `user_email` are populated

### 4. Test Dashboard Filtering
1. Sign in as User A, create some books
2. Sign out
3. Sign in as User B (different Google account)
4. Dashboard should be empty or only show User B's books
5. User B should NOT see User A's books

---

## 🎨 What Users See

### When Logged Out:
- **Navbar:** Logo | How It Works | Examples | Sign In | Start Roasting 🔥
- **Protected routes:** Redirect to login page

### When Logged In:
- **Navbar:** Logo | How It Works | Examples | [Avatar + Name ▼]
- **Dropdown Menu:** My Books | Sign Out
- **Dashboard:** Only shows their own books
- **Protected routes:** Full access

---

## 🔒 Security Features

1. **Row Level Security (RLS):** Users can only access their own books
2. **Middleware Protection:** Routes require authentication
3. **Server-side Auth:** User session verified on server
4. **Secure Cookies:** Session stored in HTTP-only cookies
5. **OAuth 2.0:** No password handling, delegated to Google

---

## 📝 Notes

- **Existing books without user_id:** Will not appear in any user's dashboard due to RLS policies. You may want to manually assign them or delete them.
- **Service Role Bypass:** API routes using `supabaseAdmin` bypass RLS, which is necessary for image generation and other backend operations.
- **Multiple OAuth Providers:** You can add more providers (GitHub, Apple, etc.) using the same pattern.

---

## ❓ Troubleshooting

### "Unauthorized - Please sign in" when creating a book
- Check that middleware is running
- Verify user is logged in (check browser console: `localStorage.getItem('supabase.auth.token')`)
- Check that `createClient()` is correctly configured

### Google OAuth not working
- Verify redirect URI matches exactly in Google Console
- Check that Google Provider is enabled in Supabase
- Verify Client ID and Secret are correct

### Users can't see their books
- Check that RLS policies are created
- Verify `user_id` is being stored when creating books
- Check that dashboard query filters by `user_id`

### Middleware causing issues
- Check `middleware.ts` matcher patterns
- Verify middleware is not blocking API routes
- Check Supabase session is being refreshed

---

## 🚀 Next Steps

After completing the manual setup:

1. Test the full authentication flow
2. Create a few test books with different users
3. Verify RLS is working correctly
4. Consider adding email verification (optional)
5. Add password reset flow if needed (optional)
6. Deploy to production and update `NEXT_PUBLIC_APP_URL`

---

## 📧 Support

If you encounter issues, check:
- Supabase logs (Dashboard → Logs)
- Browser console for errors
- Network tab for failed requests
- Supabase auth debug: https://supabase.com/docs/guides/auth/debugging
