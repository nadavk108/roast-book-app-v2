# ⚠️ CRITICAL: Supabase Auth Configuration Checklist

## The "3-Attempt" Bug Root Cause

The double login loop was caused by **missing redirect URL configuration in Supabase dashboard**.

When Google OAuth completed, Supabase couldn't redirect to `/auth/callback` because it wasn't in the allowed list, so it redirected to the Site URL (homepage) instead!

## Required Supabase Dashboard Settings

Go to your Supabase project dashboard → Authentication → URL Configuration

### 1. Site URL
```
https://theroastbook.com
```
This is your main domain (no trailing slash).

### 2. Redirect URLs (CRITICAL!)
Add BOTH of these URLs to the "Redirect URLs" list:

```
https://theroastbook.com/auth/callback
http://localhost:3001/auth/callback
```

**Why both?**
- Production URL for live site
- Localhost URL for local development

### 3. Additional Redirect URLs (if using custom domains)
If you have additional domains (like `roast-book-g05rp977x-nadavs-projects-e524d690.vercel.app`), add:
```
https://roast-book-g05rp977x-nadavs-projects-e524d690.vercel.app/auth/callback
```

## How to Verify Configuration

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/url-configuration

2. Check that "Redirect URLs" section includes:
   - `https://theroastbook.com/auth/callback`
   - `http://localhost:3001/auth/callback`

3. Click "Save" if you made any changes

## Testing After Configuration

1. **Clear browser cache and cookies completely**
2. Visit homepage
3. Click "Start Roasting"
4. Click "Sign in with Google"
5. **Should land on /dashboard on FIRST attempt** ✅

## What Changed in the Code

### Before (Broken):
```typescript
signInWithGoogle() {
  redirectTo: `${APP_URL}/auth/callback`  // No next parameter!
}
```

### After (Fixed):
```typescript
signInWithGoogle(nextUrl) {
  redirectTo: `${APP_URL}/auth/callback?next=/dashboard`  // Includes destination!
}
```

Now the OAuth flow knows where to send the user after authentication.

## Why This Caused 3 Attempts

**Attempt 1:**
- OAuth redirects to callback
- Supabase sees callback URL not in allowed list
- Redirects to Site URL (/) instead
- No session recognized yet

**Attempt 2:**
- Session partially cached from attempt 1
- Same redirect behavior
- Still blocked

**Attempt 3:**
- Enough session state accumulated
- Middleware finally recognizes user
- Allows through to dashboard

## After the Fix

**Attempt 1:**
- OAuth redirects to callback (now in allowed list!) ✅
- Callback extracts `next=/dashboard` from URL
- Waits for cookies
- Hard redirects to /dashboard
- Middleware sees session
- User reaches dashboard! ✅

---

**CRITICAL:** Update Supabase dashboard settings BEFORE testing the new code!
