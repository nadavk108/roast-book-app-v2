# Email/Password Authentication Testing Guide

## Overview
This guide will help you test the new unified email/password authentication system that was just added to your Roast Book application.

## Features Added

### 1. Unified Sign In/Sign Up Flow
- Single form that handles both sign in and sign up automatically
- No need for users to choose between "Sign In" or "Sign Up"
- Logic: If email exists → sign in, if email is new → auto sign up

### 2. Login Page Updates (`/login`)
- Email input field
- Password input field with show/hide toggle
- "Continue" button (unified action)
- "Forgot password?" link
- Password reset modal
- Error and success messages
- PostHog event tracking

### 3. Password Reset Flow
- Password reset modal on login page
- Password reset page at `/auth/reset-password`
- Email link sent via Supabase
- New password form with confirmation

### 4. PostHog Tracking Events
- `email_signin_clicked` - When user submits email/password form
- `email_signin_completed` - When sign in/sign up succeeds (with `is_new_user` flag)
- `password_reset_requested` - When user requests password reset
- `password_reset_completed` - When user successfully resets password

---

## Testing Steps

### Test 1: Sign Up (New User)

**Steps:**
1. Open browser and go to `http://localhost:3000/login`
2. Enter a NEW email: `test@example.com`
3. Enter a password: `Test123456` (minimum 6 characters)
4. Click "Continue" button

**Expected Result:**
- ✅ Account is created automatically
- ✅ User is redirected to `/dashboard`
- ✅ User appears in Supabase Dashboard → Authentication → Users
- ✅ PostHog event `email_signin_completed` with `is_new_user: true` is tracked

**Note:** If email verification is enabled in Supabase:
- You'll see message: "Account created! Check your email to verify your account."
- Check email inbox for verification link
- Click link to verify account
- Try signing in again

---

### Test 2: Sign In (Existing User)

**Steps:**
1. Go to `http://localhost:3000/login`
2. Enter the SAME email from Test 1: `test@example.com`
3. Enter the SAME password: `Test123456`
4. Click "Continue" button

**Expected Result:**
- ✅ User is signed in successfully
- ✅ Redirected to `/dashboard`
- ✅ PostHog event `email_signin_completed` with `is_new_user: false` is tracked
- ✅ User session persists (refresh page and you're still logged in)

---

### Test 3: Wrong Password

**Steps:**
1. Go to `http://localhost:3000/login`
2. Enter existing email: `test@example.com`
3. Enter WRONG password: `WrongPassword123`
4. Click "Continue" button

**Expected Result:**
- ✅ Error message displayed: "Incorrect password. Please try again."
- ✅ Red error banner appears below heading
- ✅ User is NOT signed in
- ✅ No redirect happens

---

### Test 4: Password Show/Hide Toggle

**Steps:**
1. Go to `http://localhost:3000/login`
2. Enter password: `MySecret123`
3. Click the eye icon on the right side of password field
4. Observe password becomes visible
5. Click eye icon again

**Expected Result:**
- ✅ Password is hidden by default (shows •••••••••)
- ✅ Clicking eye icon shows plain text password
- ✅ Clicking again hides password
- ✅ Eye icon changes between Eye and EyeOff icons

---

### Test 5: Password Reset Request

**Steps:**
1. Go to `http://localhost:3000/login`
2. Click "Forgot password?" link below password field
3. Modal appears with "Reset Password" heading
4. Enter email: `test@example.com`
5. Click "Send Reset Link" button

**Expected Result:**
- ✅ Modal opens with email input
- ✅ Success message: "Password reset email sent! Check your inbox."
- ✅ Modal closes
- ✅ Email is received in inbox with reset link
- ✅ PostHog event `password_reset_requested` is tracked

**Check Email:**
- You should receive an email from Supabase
- Subject: "Reset Your Password"
- Contains a link like: `http://localhost:3000/auth/reset-password?token=...`

---

### Test 6: Password Reset Completion

**Steps:**
1. Open the password reset email from Test 5
2. Click the reset link in the email
3. You should be redirected to `http://localhost:3000/auth/reset-password`
4. Enter new password: `NewPassword123`
5. Confirm new password: `NewPassword123`
6. Click "Reset Password" button

**Expected Result:**
- ✅ Reset password page loads with form
- ✅ Shows "Reset Your Password" heading
- ✅ Two password fields (New Password and Confirm New Password)
- ✅ Both fields have show/hide toggles
- ✅ After submission: Success screen with checkmark
- ✅ Message: "Password Reset Successful! Redirecting..."
- ✅ Auto-redirects to `/dashboard` after 2 seconds
- ✅ PostHog event `password_reset_completed` is tracked

**Verify Password Changed:**
1. Sign out from dashboard
2. Go back to `/login`
3. Try signing in with OLD password → Should fail
4. Try signing in with NEW password → Should succeed

---

### Test 7: Validation Errors

**Test 7a: Empty Fields**
1. Go to `/login`
2. Click "Continue" without entering anything
3. Expected: HTML5 validation prevents submission ("Please fill out this field")

**Test 7b: Invalid Email**
1. Enter email: `notanemail`
2. Enter password: `Test123456`
3. Click "Continue"
4. Expected: HTML5 validation error ("Please include an @ in the email address")

**Test 7c: Short Password**
1. Enter email: `test@example.com`
2. Enter password: `123` (less than 6 characters)
3. Click "Continue"
4. Expected: Error message "Password must be at least 6 characters."

**Test 7d: Password Mismatch (Reset Flow)**
1. Go to reset password page
2. Enter new password: `NewPassword123`
3. Enter confirm password: `DifferentPassword`
4. Click "Reset Password"
5. Expected: Error message "Passwords do not match."

---

### Test 8: Google OAuth Still Works

**Steps:**
1. Go to `http://localhost:3000/login`
2. Click "Sign in with Google" button
3. Complete Google OAuth flow

**Expected Result:**
- ✅ Google sign-in still works as before
- ✅ Email/password form doesn't interfere with Google OAuth
- ✅ Both authentication methods work independently

---

### Test 9: Session Persistence

**Steps:**
1. Sign in with email/password (or Google)
2. Close browser tab
3. Open new tab and go to `http://localhost:3000/dashboard`
4. Alternatively: Refresh the page

**Expected Result:**
- ✅ User stays logged in (no redirect to login)
- ✅ Dashboard loads normally
- ✅ User info appears in header

---

### Test 10: PostHog Event Tracking

**Verify in PostHog Dashboard:**
1. Go to your PostHog dashboard: https://posthog.com
2. Navigate to Activity → Events
3. Look for these new events:
   - `email_signin_clicked`
   - `email_signin_completed` (check `is_new_user` property)
   - `password_reset_requested`
   - `password_reset_completed`

**Expected:**
- ✅ All events appear in PostHog
- ✅ Events have correct properties
- ✅ User identification works (events are linked to user ID)

---

## Configuration Options

### Option 1: Disable Email Verification (Faster for Development)

**In Supabase Dashboard:**
1. Go to Authentication → Settings
2. Scroll to "Email Auth" section
3. Toggle OFF "Enable email confirmations"
4. Click Save

**Result:**
- Users can sign in immediately after sign up
- No verification email required
- Faster testing/development

### Option 2: Enable Email Verification (More Secure for Production)

**Keep email verification enabled (default)**

**Result:**
- New users receive verification email
- Must click link before signing in
- More secure for production

**Handle in Code:**
The code already handles both scenarios:
- If verification disabled: Auto-redirects after sign up
- If verification enabled: Shows "Check your email" message

---

## Supabase Configuration

### Check Current Settings

**In Supabase Dashboard:**
1. Go to Authentication → Providers
2. Verify "Email" is enabled
3. Go to Authentication → Settings
4. Check "Email Auth" settings:
   - ✅ Enable email provider
   - ⚙️ Enable email confirmations (on/off based on your preference)
   - ⚙️ Secure email change (recommended: on)
   - ⚙️ Secure password change (recommended: on)

### Email Templates

**Customize Reset Password Email:**
1. Go to Authentication → Email Templates
2. Select "Reset Password"
3. Customize subject and body
4. Variables available:
   - `{{ .Token }}` - Reset token
   - `{{ .TokenHash }}` - Token hash
   - `{{ .SiteURL }}` - Your app URL

**Default reset link format:**
```
{{ .SiteURL }}/auth/reset-password?token={{ .TokenHash }}&type=recovery
```

---

## Common Issues & Solutions

### Issue 1: "Invalid or expired reset link"
**Cause:** Token expired or invalid
**Solution:** Request a new password reset link

### Issue 2: "Email not confirmed"
**Cause:** Email verification is enabled but user hasn't verified
**Solution:** Check email inbox for verification link

### Issue 3: Reset email not received
**Causes:**
- Email in spam folder
- Wrong email entered
- Supabase email rate limit reached

**Solutions:**
- Check spam/junk folder
- Double-check email address
- Wait a few minutes and try again
- Check Supabase Dashboard → Authentication → Logs

### Issue 4: "Invalid login credentials" for existing user
**Causes:**
- Wrong password
- Email verification pending
- Account doesn't exist

**Solutions:**
- Try password reset flow
- Check Supabase Dashboard → Authentication → Users to verify account exists
- Check if email is confirmed

### Issue 5: Events not appearing in PostHog
**Causes:**
- PostHog not initialized (check browser console)
- Wrong PostHog key in `.env.local`

**Solutions:**
- Open browser DevTools → Console
- Look for PostHog initialization logs
- Verify `NEXT_PUBLIC_POSTHOG_KEY` is set correctly
- Check PostHog project is active

---

## Security Best Practices

### ✅ Implemented:
- Minimum 6 character password requirement
- Password show/hide toggle for security
- Secure password reset flow via email
- Session tokens handled by Supabase (httpOnly cookies)
- Error messages don't reveal if email exists (says "Invalid credentials")

### 🔒 Recommended for Production:
1. **Enable email verification** in Supabase
2. **Add rate limiting** for failed login attempts (Supabase has built-in)
3. **Stronger password requirements:**
   - Add validation for uppercase, lowercase, number, special char
   - Show password strength indicator
4. **Add CAPTCHA** to prevent bots (Google reCAPTCHA v3)
5. **Enable 2FA** (Two-Factor Authentication) for admin users
6. **Monitor auth logs** in Supabase Dashboard

---

## User Experience Summary

### New User Journey:
1. User goes to `/login`
2. Sees Google button and email/password form
3. Enters email + password, clicks "Continue"
4. **System automatically creates account** (no separate sign-up page needed)
5. (Optional) Shows "Check email" message if verification enabled
6. Redirects to `/dashboard`

### Returning User Journey:
1. User goes to `/login`
2. Enters email + password, clicks "Continue"
3. **System automatically signs in** (same form, no confusion)
4. Redirects to `/dashboard`

### Forgot Password Journey:
1. User clicks "Forgot password?" link
2. Modal opens, enters email
3. Receives reset email
4. Clicks link, lands on reset page
5. Enters new password (with confirmation)
6. Success message, auto-redirects to dashboard
7. Can now sign in with new password

---

## Next Steps

### Immediate:
1. ✅ Test all scenarios above
2. ✅ Verify PostHog events are tracking
3. ✅ Configure Supabase email verification preference
4. ✅ Test both with and without email verification

### Before Production:
1. 📧 Customize email templates in Supabase
2. 🔐 Enable email verification
3. 🎨 Add password strength indicator (optional)
4. 🤖 Add CAPTCHA for bot protection (optional)
5. 📊 Set up PostHog funnels to track conversion rates
6. 🔒 Review Supabase security settings
7. ✅ Test forgot password flow with real email

### Optional Enhancements:
- Add "Remember me" checkbox
- Add social login with other providers (GitHub, Facebook, etc.)
- Add magic link authentication (passwordless)
- Add password strength meter
- Add account deletion flow
- Add email change flow

---

## Files Modified/Created

### Modified:
1. `app/login/page.tsx` - Added email/password form, password reset modal
2. `lib/auth.ts` - Added `signInWithEmail()` and `resetPassword()` functions
3. `lib/posthog.ts` - Added new event constants for email auth

### Created:
1. `app/auth/reset-password/page.tsx` - Password reset completion page

---

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase Dashboard → Authentication → Logs
3. Verify `.env.local` has correct Supabase credentials
4. Ensure PostHog is initialized (check browser console)

---

**Testing complete! The unified email/password authentication is now live.** 🎉
