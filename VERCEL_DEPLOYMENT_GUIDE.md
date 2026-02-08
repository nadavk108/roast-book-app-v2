# Vercel Deployment Guide - theroastbook.com
## Zero-Downtime Migration from Lovable to Vercel

---

## 📋 Overview

This guide will walk you through deploying your Next.js application from Lovable hosting to Vercel with zero downtime.

**Current Setup:**
- Domain: theroastbook.com (managed via GoDaddy)
- Current Hosting: Lovable (185.158.133.1)
- Framework: Next.js 14.2.18
- Target: Vercel Production

---

## ✅ Pre-Flight Checklist

### 1. Framework Analysis

Your repository is a **Next.js 14** application (App Router), which is perfectly suited for Vercel deployment.

**Key findings:**
- ✅ No Lovable-specific code found
- ✅ All localhost URLs use environment variables with fallbacks
- ✅ `.gitignore` properly configured
- ✅ `next.config.js` is Vercel-ready

### 2. Required Environment Variables

The following environment variables from `.env.local` need to be set in Vercel:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# AI Services (REQUIRED)
OPENAI_API_KEY          # For vision analysis
ANTHROPIC_API_KEY       # For quote generation
REPLICATE_API_TOKEN     # For image generation

# Google Gemini (OPTIONAL - alternative image generation)
GEMINI_API_KEY

# Stripe (REQUIRED)
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=https://theroastbook.com
NEXT_PUBLIC_BASE_URL=https://theroastbook.com
BOOK_PRICE_CENTS=999

# PostHog Analytics (OPTIONAL)
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

**Verify installation:**
```bash
vercel --version
```

---

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate with Vercel.

---

### Step 3: Link Project to Vercel

Navigate to your project directory:

```bash
cd /Users/I754385/Downloads/files/roast-book-app
```

Initialize Vercel project:

```bash
vercel link
```

**Follow the prompts:**
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your account/team
3. **Link to existing project?** → No (first time)
4. **What's your project's name?** → `theroastbook` or `roast-book-app`
5. **In which directory is your code located?** → `./` (press Enter)

This creates a `.vercel` directory with project configuration.

---

### Step 4: Set Environment Variables

You have **two options** for setting environment variables:

#### Option A: Using Vercel CLI (Recommended for Security)

For each environment variable:

```bash
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your value when prompted: https://supymlyoquwzhpbqjdxl.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste your anon key

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste your service role key

# OpenAI
vercel env add OPENAI_API_KEY production
# Paste your OpenAI API key

# Anthropic
vercel env add ANTHROPIC_API_KEY production
# Paste your Anthropic API key

# Gemini (optional)
vercel env add GEMINI_API_KEY production
# Paste your Gemini API key

# Replicate
vercel env add REPLICATE_API_TOKEN production
# Paste your Replicate token

# Stripe
vercel env add STRIPE_SECRET_KEY production
# Paste your Stripe secret key

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Paste your Stripe publishable key

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_placeholder (you'll update this after Stripe webhook setup)

# App Config
vercel env add NEXT_PUBLIC_APP_URL production
# Paste: https://theroastbook.com

vercel env add NEXT_PUBLIC_BASE_URL production
# Paste: https://theroastbook.com

vercel env add BOOK_PRICE_CENTS production
# Paste: 999

# PostHog (optional)
vercel env add NEXT_PUBLIC_POSTHOG_KEY production
# Paste your PostHog key (or skip if not using)

vercel env add NEXT_PUBLIC_POSTHOG_HOST production
# Paste: https://us.i.posthog.com (or skip)
```

#### Option B: Using Vercel Dashboard (Faster)

1. Run the deployment first: `vercel --prod`
2. Go to: https://vercel.com/dashboard
3. Select your project
4. Go to **Settings** → **Environment Variables**
5. Add all variables at once using the web interface
6. Redeploy after adding variables

---

### Step 5: Deploy to Production

Deploy to production:

```bash
vercel --prod
```

**What happens:**
1. Vercel uploads your code
2. Runs `npm install`
3. Runs `next build`
4. Deploys to production
5. Gives you a production URL

**Expected output:**
```
✅  Production: https://theroastbook-abc123.vercel.app [1m 30s]
```

**Copy this URL** - you'll need it for validation.

---

### Step 6: Validation (Before DNS Switch)

#### Test 1: Check Vercel Preview URL

Open the Vercel URL in your browser:
```
https://theroastbook-abc123.vercel.app
```

**Verify:**
- ✅ Homepage loads correctly
- ✅ You can click "Start Roasting"
- ✅ Login page works (try signing in with Google)
- ✅ Dashboard loads (after login)
- ✅ Upload image works
- ✅ Styles look correct (neo-brutalist design)

#### Test 2: Check API Routes

```bash
curl https://theroastbook-abc123.vercel.app/api/health
```

#### Test 3: Check Supabase Connection

Test authentication:
1. Go to `https://theroastbook-abc123.vercel.app/login`
2. Try signing in with Google
3. Check if it redirects to dashboard

#### Test 4: Check Environment Variables

In your browser console on the Vercel URL:
```javascript
console.log('Supabase URL:', window.ENV_CHECK)
```

Or check the Network tab to see API calls are going to the correct Supabase instance.

---

### Step 7: Configure Custom Domain in Vercel

#### 7.1: Add Domain in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project: `theroastbook` or `roast-book-app`
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `theroastbook.com`
6. Click **Add**
7. Also add: `www.theroastbook.com`

**Vercel will show you DNS records** - note these down.

#### 7.2: Vercel DNS Records (Example)

Vercel typically provides:

```
A Record (@): 76.76.21.21 (example - use YOUR Vercel IP)
CNAME (www): cname.vercel-dns.com (example - use YOUR Vercel CNAME)
```

**Important:** Vercel will show you the **exact** records in the dashboard.

---

## 🌐 DNS Transition Plan (GoDaddy)

### Current DNS Configuration:
```
A Record (@): 185.158.133.1 (Lovable)
CNAME (www): theroastbook.com
TXT (_lovable): lovable-verification=62...
TXT (_dmarc): v=DMARC1; p=quarantine;
```

### New DNS Configuration (DO NOT UPDATE YET):

**Step 1:** Log in to GoDaddy DNS Management

**Step 2:** Update the following records:

#### Record 1: Update A Record
```
Type: A
Name: @
Value: [VERCEL_IP_FROM_DASHBOARD]
TTL: 600 (10 minutes for fast propagation)
```

**Replace with:** The A record IP from Vercel dashboard

#### Record 2: Update CNAME Record
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com (or the value Vercel provides)
TTL: 600
```

**KEEP UNCHANGED:**
```
TXT Record (_lovable): lovable-verification=62... (safe to keep)
TXT Record (_dmarc): v=DMARC1; p=quarantine; (DO NOT TOUCH)
```

---

## ⏱️ Zero-Downtime Transition Timeline

### Phase 1: Pre-Deployment (You are here)
- ✅ Vercel deployment complete
- ✅ Environment variables set
- ✅ Preview URL tested and working

### Phase 2: DNS Update (5-10 minutes)
1. Update A record in GoDaddy
2. Update CNAME record in GoDaddy
3. Wait 2-3 minutes

### Phase 3: Propagation (10-30 minutes)
- DNS propagates globally
- Some users see Lovable (old), some see Vercel (new)
- Both are operational during this time

### Phase 4: Complete (30 minutes - 24 hours)
- All traffic now goes to Vercel
- Lovable hosting can be deactivated

---

## 🔍 Post-DNS Switch Validation

After updating DNS, wait **5 minutes**, then test:

### Test 1: Check DNS Propagation

```bash
# Check A record
dig theroastbook.com +short

# Expected: Vercel IP (e.g., 76.76.21.21)
```

```bash
# Check CNAME record
dig www.theroastbook.com +short

# Expected: cname.vercel-dns.com
```

### Test 2: Check HTTPS Certificate

```bash
curl -I https://theroastbook.com
```

**Expected:**
- `200 OK` status
- `x-vercel-id` header present
- No certificate errors

### Test 3: Full Site Test

Open https://theroastbook.com in **incognito mode** (to avoid cache):

1. ✅ Homepage loads
2. ✅ Click "Start Roasting"
3. ✅ Login with Google
4. ✅ Dashboard shows your books
5. ✅ Upload new image
6. ✅ Payment flow works

---

## 🔧 Post-Deployment Configuration

### 1. Update Stripe Webhook Endpoint

Your Stripe webhook endpoint has changed:

**Old:** `https://theroastbook.com/api/webhooks/stripe` (points to Lovable)
**New:** `https://theroastbook.com/api/webhooks/stripe` (points to Vercel after DNS)

**Action Required:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Find your webhook endpoint
3. Click **Update endpoint**
4. Verify URL is: `https://theroastbook.com/api/webhooks/stripe`
5. **Copy the new webhook secret** (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in Vercel:

```bash
vercel env rm STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste the new webhook secret
```

7. Redeploy:
```bash
vercel --prod
```

### 2. Update Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Verify these URLs:
   - **Site URL:** `https://theroastbook.com`
   - **Redirect URLs:** Add `https://theroastbook.com/auth/callback`

### 3. Update OAuth Providers (Google)

If you're using Google Sign-In:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, add:
   - `https://theroastbook.com`
   - `https://www.theroastbook.com`
4. Under **Authorized redirect URIs**, verify:
   - `https://supymlyoquwzhpbqjdxl.supabase.co/auth/v1/callback`

---

## 📊 Monitoring & Logging

### Vercel Dashboard

Monitor your deployment:
1. Go to: https://vercel.com/dashboard
2. Select your project
3. View:
   - **Deployments** - deployment history
   - **Analytics** - traffic and performance
   - **Logs** - real-time logs (shows console.log, errors)

### Real-Time Logs

```bash
vercel logs --follow
```

### Check Deployment Status

```bash
vercel ls
```

---

## 🆘 Troubleshooting

### Issue 1: Environment Variables Not Loading

**Symptom:** Supabase errors, "undefined" values

**Fix:**
```bash
# List current env vars
vercel env ls

# Pull env vars locally
vercel env pull .env.production

# Redeploy
vercel --prod
```

### Issue 2: Build Fails

**Symptom:** Deployment fails during build

**Fix:**
```bash
# Test build locally
npm run build

# If it works locally but fails on Vercel, check Node version
node --version

# Update package.json if needed
```

### Issue 3: Database Connection Issues

**Symptom:** "Could not connect to database"

**Check:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` in Vercel dashboard
2. Check Supabase dashboard for connection issues
3. Verify service role key is correct

### Issue 4: Stripe Webhooks Failing

**Symptom:** Payments complete but book doesn't unlock

**Fix:**
1. Check Stripe webhook logs: https://dashboard.stripe.com/webhooks
2. Verify `STRIPE_WEBHOOK_SECRET` is updated
3. Test webhook:
```bash
stripe listen --forward-to https://theroastbook.com/api/webhooks/stripe
```

### Issue 5: DNS Not Propagating

**Symptom:** Still seeing old Lovable site

**Check:**
```bash
# Check your DNS
dig theroastbook.com

# Check from multiple locations
https://www.whatsmydns.net/#A/theroastbook.com
```

**Fix:**
- Lower TTL in GoDaddy to 300 seconds
- Wait 10-15 minutes
- Clear browser cache (Cmd+Shift+R)

---

## 🔄 Rollback Plan

If something goes wrong, you can rollback instantly:

### Option 1: Rollback DNS (Fastest)

In GoDaddy, change the A record back to:
```
A Record (@): 185.158.133.1 (Lovable)
```

**Takes effect in 5-10 minutes.**

### Option 2: Rollback Vercel Deployment

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

---

## ✅ Final Checklist

Before DNS switch:
- [ ] Vercel production deployment successful
- [ ] Preview URL fully tested
- [ ] All environment variables set in Vercel
- [ ] Homepage, login, dashboard, upload all work on preview URL
- [ ] Stripe test payment works on preview URL

After DNS switch:
- [ ] `dig theroastbook.com` shows Vercel IP
- [ ] https://theroastbook.com loads correctly
- [ ] Google Sign-In works
- [ ] Dashboard shows books
- [ ] Upload new image works
- [ ] Payment flow works
- [ ] Stripe webhook updated and tested

Post-deployment:
- [ ] Update Stripe webhook secret in Vercel
- [ ] Verify Supabase redirect URLs
- [ ] Update Google OAuth origins
- [ ] Monitor Vercel logs for errors
- [ ] Test from multiple devices/browsers

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vercel CLI Reference:** https://vercel.com/docs/cli
- **Next.js on Vercel:** https://vercel.com/docs/frameworks/nextjs
- **Vercel Support:** https://vercel.com/support

---

## 🎉 You're Ready!

Your app is fully prepared for Vercel deployment. Follow the steps above carefully, and you'll have a zero-downtime migration.

**Estimated Total Time:** 30-45 minutes (excluding DNS propagation)

---

**Next Step:** Begin with Step 1 (Install Vercel CLI) and work through each step sequentially.

Good luck! 🚀
