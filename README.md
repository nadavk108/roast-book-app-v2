# The Roast Book - Full Stack Application

A Next.js application that generates personalized AI-powered roast books with 8 custom images and quotes.

## 🎯 Product Overview

- **Price**: $9.99 per book
- **Content**: 8 AI-generated roast images + downloadable pack
- **Preview**: First 3 slides free (cover + 2 roasts)
- **Paywall**: Stripe checkout on slide 4
- **Features**: Instagram Stories style viewer, shareable links, ZIP download

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Database**: Supabase (Postgres + Storage)
- **AI Services**:
  - OpenAI GPT-4o (vision analysis)
  - OpenAI GPT-4o-mini (prompt engineering)
  - Anthropic Claude Sonnet 4 (quote generation)
  - Replicate Flux Pro (image generation)
- **Payment**: Stripe Checkout + Webhooks
- **Deployment**: Vercel (recommended)

## 📦 What's Included

```
roast-book-app/
├── app/
│   ├── api/                    # API routes
│   │   ├── upload/             # Image upload & DB creation
│   │   ├── analyze/            # GPT-4o vision analysis
│   │   ├── generate-quotes/    # Claude quote generation
│   │   ├── generate-preview/   # Generate first 3 images
│   │   ├── checkout/           # Stripe checkout session
│   │   ├── webhooks/stripe/    # Payment webhook handler
│   │   ├── generate-remaining/ # Generate final 5 images
│   │   └── book/[id]/          # Fetch book data
│   ├── preview/[id]/           # Preview page with paywall
│   ├── book/[slug]/            # Full book viewer
│   └── page.tsx                # Home page (upload flow)
├── components/ui/              # Reusable UI components
├── lib/                        # Core services
│   ├── supabase.ts            # Database client
│   ├── image-generation.ts    # Image gen abstraction
│   ├── vision-analysis.ts     # GPT-4o vision
│   ├── quote-generation.ts    # Claude quotes
│   ├── prompt-engineering.ts  # Visual prompt creation
│   ├── stripe.ts              # Payment processing
│   └── utils.ts               # Helper functions
└── ...config files
```

## 🚀 Quick Start

### Prerequisites

1. Node.js 18+ installed
2. Accounts created:
   - Supabase (free tier)
   - OpenAI API
   - Anthropic API
   - Replicate API
   - Stripe

### Step 1: Clone and Install

```bash
cd roast-book-app
npm install
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Project Settings > API to get your keys
3. Go to Storage and create a bucket called `roast-books` (make it public)
4. Run this SQL in the SQL Editor:

```sql
-- Create roast_books table
CREATE TABLE roast_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  victim_name TEXT NOT NULL,
  victim_image_url TEXT NOT NULL,
  victim_description TEXT,
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

-- Create index for faster lookups
CREATE INDEX idx_roast_books_slug ON roast_books(slug);
CREATE INDEX idx_roast_books_stripe_session ON roast_books(stripe_session_id);
```

### Step 3: Get API Keys

**OpenAI** (https://platform.openai.com/api-keys)
- Create an API key
- Add $10 credit to your account

**Anthropic** (https://console.anthropic.com/)
- Create an API key
- Add $10 credit

**Replicate** (https://replicate.com/account/api-tokens)
- Create an API token
- Add $10 credit

**Stripe** (https://dashboard.stripe.com/test/apikeys)
- Get your Test Secret Key and Publishable Key
- We'll set up webhooks after deployment

### Step 4: Configure Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your actual keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...

# OpenAI
OPENAI_API_KEY=sk-proj-xxxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxx

# Replicate
REPLICATE_API_TOKEN=r8_xxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx  # Leave empty for now

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
BOOK_PRICE_CENTS=999
```

### Step 5: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment (Vercel)

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Step 2: Add Environment Variables

In Vercel Dashboard:
1. Go to Settings > Environment Variables
2. Add all variables from `.env.local`
3. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL

### Step 3: Set Up Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Events to send: `checkout.session.completed`
5. Copy the webhook secret
6. Add to Vercel: `STRIPE_WEBHOOK_SECRET=whsec_xxxx`
7. Redeploy

## 💰 Cost Analysis (Per Book)

| Service | Cost | Notes |
|---------|------|-------|
| Image Generation (8×) | $0.24 | Replicate Flux Pro @ $0.03/image |
| Vision Analysis | $0.01 | GPT-4o |
| Quote Generation | $0.02 | Claude Sonnet 4 |
| Prompt Engineering (8×) | $0.04 | GPT-4o-mini |
| Storage & Hosting | $0.01 | Supabase + Vercel |
| **Total COGS** | **$0.32** | |
| **Selling Price** | $9.99 | |
| **Gross Margin** | $9.67 | 97% |
| **Net Margin (after Stripe)** | $9.38 | 94% |

## 🔧 Switching Image Providers

The code is designed to easily swap image generation providers:

**In `lib/image-generation.ts`:**

```typescript
// Change this line:
const ACTIVE_PROVIDER: ImageProvider = 'replicate-flux-pro';

// To use cheaper option:
const ACTIVE_PROVIDER: ImageProvider = 'replicate-flux-dev'; // $0.01/image

// Or to use Gemini (when implemented):
const ACTIVE_PROVIDER: ImageProvider = 'gemini'; // $1.44/image
```

## 📝 Testing the Flow

### 1. Create a Book
- Upload a photo
- Enter 8 quotes (or use AI generation)
- Wait ~60 seconds for preview generation

### 2. Preview & Paywall
- View cover + 2 roast slides
- Hit paywall on slide 4
- Click "Pay $9.99"

### 3. Stripe Test Payment
Use test card: `4242 4242 4242 4242`
- Exp: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### 4. Full Book
- After payment, remaining 5 images generate (~2 min)
- Download ZIP of all 8 images
- Share unique URL

## 🐛 Troubleshooting

### Images not generating
- Check Replicate API token is valid
- Check you have credit in Replicate account
- Look at Vercel function logs

### Webhook not working
- Verify webhook secret in Vercel env vars
- Check webhook URL is correct in Stripe
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Database errors
- Verify Supabase service role key
- Check bucket `roast-books` exists and is public
- Run the SQL setup script again

## 🎨 Customization

### Design System

All colors/fonts defined in `app/globals.css`:

```css
:root {
  --primary: 48 96% 53%;      /* Electric Yellow */
  --accent: 330 85% 60%;      /* Hot Pink */
  --secondary: 0 0% 5%;       /* Deep Black */
  /* ...more colors */
}
```

### Pricing

Change in `.env.local`:

```env
BOOK_PRICE_CENTS=999  # $9.99
# Or:
BOOK_PRICE_CENTS=1499  # $14.99
```

### Number of Quotes

Currently hardcoded to 8. To change:

1. Update quote generation in `lib/quote-generation.ts` (line ~45)
2. Update preview generation count in `app/api/generate-preview/route.ts` (line ~60)
3. Update remaining generation loop in `app/api/generate-remaining/route.ts` (line ~64)

## 📊 Production Checklist

Before launching:

- [ ] Switch Stripe to live mode keys
- [ ] Update webhook to production URL
- [ ] Set up proper error monitoring (Sentry)
- [ ] Add analytics (PostHog, Plausible)
- [ ] Configure custom domain
- [ ] Set up email notifications (Resend)
- [ ] Add rate limiting (Upstash)
- [ ] Implement proper queue (BullMQ) for image generation
- [ ] Add Terms of Service & Privacy Policy
- [ ] Test on real devices (iOS Safari, Android Chrome)

## 🆘 Support

- **Issues**: Check Vercel function logs + Supabase logs
- **Costs**: Monitor Replicate usage dashboard
- **Payments**: Check Stripe dashboard for failed payments

## 📜 License

Private - All Rights Reserved
