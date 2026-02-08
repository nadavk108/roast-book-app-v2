# Quick Start: Deploy to Vercel in 10 Minutes

This is the streamlined version of the deployment guide. For comprehensive details, see `VERCEL_DEPLOYMENT_GUIDE.md`.

---

## Step 1: Login to Vercel

```bash
npx vercel login
```

Follow the browser prompt to authenticate.

---

## Step 2: Deploy to Vercel

```bash
npx vercel
```

**Answer the prompts:**
- Set up and deploy? → **Y**
- Which scope? → Select your account
- Link to existing project? → **N** (first time)
- What's your project's name? → **theroastbook**
- In which directory is your code located? → **./** (press Enter)
- Want to modify settings? → **N**

**This will create a preview deployment** (e.g., `theroastbook-abc123.vercel.app`)

---

## Step 3: Set Environment Variables

### Option A: Using Vercel Dashboard (Easiest)

1. Go to: https://vercel.com/dashboard
2. Select your project: **theroastbook**
3. Go to: **Settings** → **Environment Variables**
4. Add all variables from the list below (copy from your `.env.local`)
5. Set environment to: **Production**

### Option B: Using CLI (One by one)

```bash
# Copy these commands and replace YOUR_VALUE with actual values

npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add OPENAI_API_KEY production
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add GEMINI_API_KEY production
npx vercel env add REPLICATE_API_TOKEN production
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add NEXT_PUBLIC_APP_URL production
npx vercel env add NEXT_PUBLIC_BASE_URL production
npx vercel env add BOOK_PRICE_CENTS production
npx vercel env add NEXT_PUBLIC_POSTHOG_KEY production
npx vercel env add NEXT_PUBLIC_POSTHOG_HOST production
```

### Required Environment Variables Checklist

Copy these from your `.env.local`:

```
✓ NEXT_PUBLIC_SUPABASE_URL=https://supymlyoquwzhpbqjdxl.supabase.co
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
✓ SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
✓ OPENAI_API_KEY=sk-proj-...
✓ ANTHROPIC_API_KEY=sk-ant-...
✓ GEMINI_API_KEY=AIza...
✓ REPLICATE_API_TOKEN=r8_...
✓ STRIPE_SECRET_KEY=sk_test_...
✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
✓ STRIPE_WEBHOOK_SECRET=whsec_placeholder
✓ NEXT_PUBLIC_APP_URL=https://theroastbook.com
✓ NEXT_PUBLIC_BASE_URL=https://theroastbook.com
✓ BOOK_PRICE_CENTS=999
✓ NEXT_PUBLIC_POSTHOG_KEY=your_key_or_skip
✓ NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Step 4: Deploy to Production

```bash
npx vercel --prod
```

**Expected output:**
```
✅ Production: https://theroastbook-abc123.vercel.app [deployed]
```

**Copy this URL** - you'll test it next.

---

## Step 5: Test Production URL

Open the Vercel URL in your browser:
```
https://theroastbook-abc123.vercel.app
```

**Test these features:**
1. ✅ Homepage loads
2. ✅ Click "Start Roasting"
3. ✅ Login with Google
4. ✅ Dashboard shows your books
5. ✅ Upload a new image
6. ✅ Quotes submission works
7. ✅ Preview generation works

**If everything works → proceed to DNS update**

---

## Step 6: Add Custom Domain

### 6.1: Add Domain in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select: **theroastbook**
3. Go to: **Settings** → **Domains**
4. Click: **Add Domain**
5. Enter: `theroastbook.com`
6. Click: **Add**
7. Also add: `www.theroastbook.com`

Vercel will show you the DNS records you need.

---

## Step 7: Update DNS in GoDaddy

**⚠️ BEFORE YOU UPDATE DNS:**
- Make sure the Vercel preview URL works 100%
- All features tested and working
- Environment variables all set correctly

### Update these records in GoDaddy:

1. **A Record**
   - Type: `A`
   - Name: `@`
   - Value: `[IP from Vercel dashboard]` (e.g., `76.76.21.21`)
   - TTL: `600` seconds

2. **CNAME Record**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com` (or the value Vercel shows)
   - TTL: `600` seconds

**DO NOT TOUCH:**
- `_lovable` TXT record (safe to keep)
- `_dmarc` TXT record (DO NOT MODIFY)

---

## Step 8: Wait for DNS Propagation

After updating DNS, wait **5-10 minutes**, then test:

```bash
# Check if DNS updated
dig theroastbook.com +short
```

Expected: Vercel IP (not 185.158.133.1)

---

## Step 9: Verify Live Site

Open https://theroastbook.com in **incognito mode**:

1. ✅ Homepage loads
2. ✅ Click "Start Roasting"
3. ✅ Login works
4. ✅ Dashboard shows books
5. ✅ Upload works
6. ✅ Check Network tab - should see `x-vercel-id` header

---

## Step 10: Update Stripe Webhook (CRITICAL)

After DNS switch, your Stripe webhook needs updating:

1. Go to: https://dashboard.stripe.com/webhooks
2. Select your webhook
3. Click: **Update endpoint**
4. Verify URL: `https://theroastbook.com/api/webhooks/stripe`
5. **Copy the new webhook secret** (starts with `whsec_`)
6. Update in Vercel:

```bash
npx vercel env rm STRIPE_WEBHOOK_SECRET production
npx vercel env add STRIPE_WEBHOOK_SECRET production
# Paste the new secret when prompted
```

7. Redeploy:
```bash
npx vercel --prod
```

---

## ✅ Deployment Complete!

Your site is now live on Vercel at https://theroastbook.com

---

## 🆘 Quick Troubleshooting

### Issue: "Environment variable undefined"
**Fix:**
```bash
# Check env vars
npx vercel env ls

# Redeploy
npx vercel --prod
```

### Issue: "Still seeing old Lovable site"
**Fix:**
```bash
# Check DNS
dig theroastbook.com

# Clear browser cache
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Issue: "Payments not working"
**Fix:** Update Stripe webhook secret (see Step 10)

---

## 📊 View Logs

```bash
# Real-time logs
npx vercel logs --follow

# Or view in dashboard
https://vercel.com/dashboard → Your Project → Logs
```

---

## 🔄 Rollback (If Needed)

If something goes wrong:

**Quick rollback:** Change A record in GoDaddy back to:
```
185.158.133.1 (Lovable IP)
```

Takes effect in 5-10 minutes.

---

**Need help?** See the full guide: `VERCEL_DEPLOYMENT_GUIDE.md`
