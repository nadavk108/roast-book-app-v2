# 🚀 QUICKSTART GUIDE

Get The Roast Book running in 15 minutes.

## Step 1: Install Dependencies (2 min)

```bash
cd roast-book-app
npm install
```

## Step 2: Set Up Supabase (5 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. **Copy your credentials**:
   - Project URL (Settings > API > Project URL)
   - Anon Key (Settings > API > anon public)
   - Service Role Key (Settings > API > service_role - keep this secret!)

3. **Create storage bucket**:
   - Go to Storage
   - Click "New bucket"
   - Name: `roast-books`
   - Toggle "Public bucket" to ON
   - Create

4. **Set up database**:
   - Go to SQL Editor
   - Click "New query"
   - Copy/paste contents of `database-setup.sql`
   - Click "Run"

## Step 3: Get API Keys (5 min)

### OpenAI
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Add $10 to your account (Billing)

### Anthropic
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Add $10 credit

### Replicate
1. Go to [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Create token
3. Add $10 credit

### Stripe
1. Go to [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy "Publishable key" (starts with `pk_test_`)
3. Reveal and copy "Secret key" (starts with `sk_test_`)

## Step 4: Configure Environment (1 min)

```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:

```env
# From Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# From OpenAI
OPENAI_API_KEY=sk-proj-xxxx

# From Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxx

# From Replicate
REPLICATE_API_TOKEN=r8_xxxx

# From Stripe
STRIPE_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
STRIPE_WEBHOOK_SECRET=  # Leave empty for now

# App config (don't change yet)
NEXT_PUBLIC_APP_URL=http://localhost:3000
BOOK_PRICE_CENTS=999
```

## Step 5: Run! (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing the App

### Create a Test Book

1. **Upload**: Pick any photo, enter a name (e.g., "Test")
2. **Quotes**: Enter 8 quotes manually OR:
   - Click "AI Generate"
   - Enter traits: "Loves expensive coffee, drives a Tesla, wears designer clothes"
   - Click "Generate Quotes"
3. **Optional greeting**: Add a nice message at the end
4. Click "Create Roast Book"

**Wait ~60 seconds** while it generates preview images.

### Test Payment

When you hit the paywall:

1. Click "Pay $9.99 to Unlock"
2. Use test card: `4242 4242 4242 4242`
3. Expiry: Any future date (e.g., 12/25)
4. CVC: Any 3 digits (e.g., 123)
5. ZIP: Any 5 digits (e.g., 12345)

**Wait ~2 minutes** for remaining images to generate.

## Common Issues

### "Failed to upload"
- Check Supabase storage bucket exists
- Verify bucket is public
- Check storage policies are set

### "Failed to generate quotes"
- Verify Anthropic API key
- Check you have credit in Anthropic account
- Look at terminal logs for errors

### "Failed to generate preview"
- Verify Replicate API token
- Check you have credit in Replicate account
- Look at terminal for specific error

### Webhook not firing (after payment)
- This is expected in local dev
- Remaining images won't generate automatically
- You'll need to set up webhooks after deploying to Vercel

## Next Steps

Once everything works locally:

1. **Deploy to Vercel**: See main README.md
2. **Set up Stripe webhooks**: See main README.md
3. **Go live**: Switch to Stripe live keys

## Cost Estimates

**Per book (8 images):**
- Image generation: $0.24 (Replicate)
- Vision analysis: $0.01 (OpenAI)
- Quote generation: $0.02 (Anthropic)
- Prompt engineering: $0.04 (OpenAI)
- **Total: ~$0.31 per book**

**Your $10 credits will get you:**
- ~30 test books across all services

## Need Help?

Check the main `README.md` for:
- Full documentation
- Deployment guide
- Troubleshooting
- Customization options

---

**You're ready to go!** 🎉

Create your first roast book and see the magic happen.
