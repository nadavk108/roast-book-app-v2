# DNS Transition Checklist - Zero Downtime Migration

## Pre-DNS Switch Checklist

Complete these BEFORE updating DNS in GoDaddy:

### ✅ Vercel Deployment Validation

- [ ] Vercel CLI installed: `npx vercel --version`
- [ ] Logged into Vercel: `npx vercel login`
- [ ] Project deployed: `npx vercel --prod`
- [ ] Production URL received (e.g., `theroastbook-abc123.vercel.app`)

### ✅ Environment Variables Verification

Run this command to list all production environment variables:
```bash
npx vercel env ls
```

**Required variables checklist:**
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] OPENAI_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] REPLICATE_API_TOKEN
- [ ] STRIPE_SECRET_KEY
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] NEXT_PUBLIC_APP_URL (set to https://theroastbook.com)
- [ ] NEXT_PUBLIC_BASE_URL (set to https://theroastbook.com)
- [ ] BOOK_PRICE_CENTS (set to 999)
- [ ] NEXT_PUBLIC_POSTHOG_KEY (optional)
- [ ] NEXT_PUBLIC_POSTHOG_HOST (optional)

### ✅ Production URL Testing

Open your Vercel production URL: `https://theroastbook-abc123.vercel.app`

**Functional tests:**
- [ ] Homepage loads correctly
- [ ] Navigation works (click "Start Roasting")
- [ ] Google Sign-In works
- [ ] Dashboard loads after login
- [ ] Dashboard shows existing roast books
- [ ] Can upload a new victim image
- [ ] Quotes submission works (3 quotes)
- [ ] Progress page shows generation status
- [ ] Preview page displays correctly
- [ ] Payment button visible (Stripe integration working)

**Technical tests:**
- [ ] Open DevTools → Network tab
- [ ] Check API calls succeed (200 status)
- [ ] Verify `x-vercel-id` header present in responses
- [ ] Check Console for errors (should be minimal/none)
- [ ] Test image loading from Supabase
- [ ] Verify styles load correctly (neo-brutalist design)

**Browser compatibility:**
- [ ] Works in Chrome
- [ ] Works in Safari
- [ ] Works in Firefox
- [ ] Works on mobile (responsive design)

---

## DNS Records - Current State

**Document your CURRENT GoDaddy DNS settings:**

```
A Record (@): 185.158.133.1 (Lovable)
CNAME (www): theroastbook.com
TXT (_lovable): lovable-verification=62... (KEEP THIS)
TXT (_dmarc): v=DMARC1; p=quarantine; (DO NOT TOUCH)
```

---

## Vercel DNS Requirements

**Get these values from Vercel Dashboard:**

1. Go to: https://vercel.com/dashboard
2. Select project: `theroastbook`
3. Go to: **Settings** → **Domains**
4. Add domain: `theroastbook.com`
5. Note down the DNS records Vercel provides

**Example Vercel records (yours will be different):**
```
A Record: 76.76.21.21
CNAME: cname.vercel-dns.com
```

**Write down YOUR actual Vercel values here:**
```
A Record IP: _______________________
CNAME Target: _______________________
```

---

## DNS Update Instructions

### Step 1: Login to GoDaddy

1. Go to: https://www.godaddy.com
2. Login to your account
3. Navigate to: **My Products** → **DNS** for theroastbook.com

### Step 2: Update A Record

**Current:**
```
Type: A
Name: @
Value: 185.158.133.1
TTL: 1 Hour
```

**Change to:**
```
Type: A
Name: @
Value: [YOUR VERCEL IP FROM ABOVE]
TTL: 10 minutes (600 seconds)
```

- [ ] A Record updated

### Step 3: Update CNAME Record

**Current:**
```
Type: CNAME
Name: www
Value: theroastbook.com
TTL: 1 Hour
```

**Change to:**
```
Type: CNAME
Name: www
Value: [YOUR VERCEL CNAME FROM ABOVE]
TTL: 10 minutes (600 seconds)
```

- [ ] CNAME Record updated

### Step 4: Verify Existing Records Stay Intact

**DO NOT MODIFY THESE:**
- [ ] TXT Record (_lovable) - Still present
- [ ] TXT Record (_dmarc) - Still present

---

## Post-DNS Update Validation

### Wait Period

After updating DNS:
- Wait **5 minutes** minimum
- Full global propagation: 10-30 minutes
- Some users may still see old site during propagation

### Validation Commands

#### 1. Check DNS Propagation

```bash
# Check A record
dig theroastbook.com +short
```

**Expected output:** Your Vercel IP (e.g., `76.76.21.21`)
**NOT:** `185.158.133.1`

- [ ] A record resolves to Vercel IP

```bash
# Check CNAME record
dig www.theroastbook.com +short
```

**Expected output:** `cname.vercel-dns.com` or similar
- [ ] CNAME record resolves to Vercel

#### 2. Check from Multiple Locations

Visit: https://www.whatsmydns.net/#A/theroastbook.com

- [ ] Shows Vercel IP in most locations
- [ ] Green checkmarks appearing globally

#### 3. Check HTTPS Certificate

```bash
curl -I https://theroastbook.com
```

**Expected:**
```
HTTP/2 200
x-vercel-id: [some-value]
...
```

- [ ] Returns 200 OK
- [ ] Contains `x-vercel-id` header
- [ ] No SSL certificate errors

#### 4. Test Main Domain

Open in **incognito mode**: https://theroastbook.com

- [ ] Homepage loads
- [ ] Shows correct content (not Lovable site)
- [ ] No console errors
- [ ] Images load correctly
- [ ] Login works
- [ ] Dashboard accessible

#### 5. Test WWW Subdomain

Open in **incognito mode**: https://www.theroastbook.com

- [ ] Redirects to https://theroastbook.com OR loads correctly
- [ ] Same functionality as main domain

---

## Post-Migration Configuration

### 1. Update Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Authentication** → **URL Configuration**
4. Update:
   - **Site URL:** `https://theroastbook.com`
   - **Redirect URLs:** Add `https://theroastbook.com/auth/callback`

- [ ] Supabase URLs updated

### 2. Update Google OAuth Settings

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Update **Authorized JavaScript origins:**
   - Add: `https://theroastbook.com`
   - Add: `https://www.theroastbook.com`
4. Verify **Authorized redirect URIs:**
   - Should include: `https://supymlyoquwzhpbqjdxl.supabase.co/auth/v1/callback`

- [ ] Google OAuth updated

### 3. Update Stripe Webhook

**CRITICAL:** Your Stripe webhook endpoint has changed

1. Go to: https://dashboard.stripe.com/webhooks
2. Select your webhook: `theroastbook.com/api/webhooks/stripe`
3. Click: **Update endpoint**
4. Verify URL: `https://theroastbook.com/api/webhooks/stripe`
5. **Events to send:**
   - `checkout.session.completed`
6. Save and **copy the new webhook secret**

**Update secret in Vercel:**
```bash
# Remove old secret
npx vercel env rm STRIPE_WEBHOOK_SECRET production

# Add new secret
npx vercel env add STRIPE_WEBHOOK_SECRET production
# Paste the new whsec_... value when prompted
```

**Redeploy:**
```bash
npx vercel --prod
```

- [ ] Stripe webhook updated
- [ ] New secret added to Vercel
- [ ] Redeployed

### 4. Test Payment Flow

1. Go to: https://theroastbook.com
2. Create a new roast book
3. Upload image, add quotes
4. Click "Unlock Full Book"
5. Use Stripe test card: `4242 4242 4242 4242`
6. Verify book unlocks after payment

- [ ] Payment flow works end-to-end

---

## Final Validation Checklist

### Functional Tests

- [ ] Homepage loads at https://theroastbook.com
- [ ] www subdomain works
- [ ] Google Sign-In successful
- [ ] Dashboard shows existing books
- [ ] Can create new roast book
- [ ] Upload image works
- [ ] Quotes submission works
- [ ] Preview generation works
- [ ] Payment flow works (Stripe)
- [ ] Book unlocks after payment
- [ ] Can download/view completed book

### Technical Tests

- [ ] DNS resolves to Vercel
- [ ] HTTPS certificate valid (no warnings)
- [ ] `x-vercel-id` header present
- [ ] No 404 errors
- [ ] No 500 errors
- [ ] Images load from Supabase
- [ ] API routes working
- [ ] Supabase connection working
- [ ] Stripe integration working

### Performance Tests

- [ ] Homepage loads in < 2 seconds
- [ ] Lighthouse score > 80 (run in DevTools)
- [ ] No console errors
- [ ] No broken images

---

## Monitoring

### Vercel Dashboard

**Check regularly for first 24 hours:**

1. Go to: https://vercel.com/dashboard
2. Select: `theroastbook`
3. Monitor:
   - **Analytics** - page views, performance
   - **Logs** - real-time error logs
   - **Deployments** - deployment status

### Real-Time Logs

```bash
npx vercel logs --follow
```

Watch for:
- ❌ 500 errors
- ❌ Database connection errors
- ❌ Stripe webhook failures
- ❌ Image generation errors

---

## Rollback Plan (If Needed)

If critical issues occur, rollback immediately:

### Quick Rollback: Revert DNS

**In GoDaddy DNS Management:**

1. Update A Record:
   ```
   Type: A
   Name: @
   Value: 185.158.133.1 (back to Lovable)
   TTL: 600 seconds
   ```

2. Update CNAME Record:
   ```
   Type: CNAME
   Name: www
   Value: theroastbook.com
   TTL: 600 seconds
   ```

**Takes effect in 5-10 minutes**

- [ ] DNS rolled back (if needed)
- [ ] Site back on Lovable (if needed)

---

## Success Criteria

All of these must be ✅ before considering migration complete:

- [ ] DNS resolves to Vercel IP
- [ ] HTTPS works without warnings
- [ ] All pages load correctly
- [ ] Authentication works (Google Sign-In)
- [ ] Payment flow works (Stripe)
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Stripe webhook configured
- [ ] Supabase redirect URLs updated
- [ ] Google OAuth updated
- [ ] Monitoring in place

---

## Timeline

**Total migration time:** ~30-45 minutes
- Pre-checks: 10 minutes
- DNS update: 2 minutes
- DNS propagation: 10-30 minutes
- Post-migration config: 10 minutes

---

## Need Help?

If issues occur:
1. Check Vercel logs: `npx vercel logs`
2. Check Supabase logs: Dashboard → Logs
3. Check Stripe webhooks: Dashboard → Webhooks → Logs
4. If critical: Rollback DNS immediately

---

**Migration Date:** _______________
**Started:** _______________
**Completed:** _______________
**Status:** _______________

