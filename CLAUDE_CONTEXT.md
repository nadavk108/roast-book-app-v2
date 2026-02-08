# The Roast Book - Claude Code Context

## ⚡ CRITICAL: Read This First (Every Session)
**You (Claude Code) must read these files before responding:**
1. This file (CLAUDE_CONTEXT.md) - Full project context
2. claude_rules.md - Operating rules
3. CHANGELOG.md - Recent changes

**Then acknowledge you understand:**
- I'm non-technical and cannot code
- You provide complete files, not diffs
- I test in production on mobile
- You explain in plain English first

**Only after reading these should you say: "I'm ready. What do you need?"**

---

[rest of CLAUDE_CONTEXT.md continues...]
```

Then your prompt can be even shorter:
```
Read the docs as instructed in CLAUDE_CONTEXT.md. What do you need?

## WHO I AM (READ THIS FIRST)
I am a **non-technical founder**. I do NOT code.

### What I CAN do:
- Test the actual product on my mobile phone (Chrome mobile)
- Copy-paste code files you give me (though I don't understand them)
- View Supabase dashboard and take screenshots of tables
- Export full database tables to send you
- Check browser console (F12) for errors
- Provide detailed error messages and screenshots

### What I CANNOT do:
- Write, read, or understand code
- Use terminal/command line
- Use Git/GitHub commands
- Edit environment variables in Vercel
- View Vercel deployment logs
- Debug code issues myself
- Make "small tweaks" to files

### How I Work with You:
- You (Claude Code) are my entire development team
- I validate by clicking through the actual website on mobile
- I test in PRODUCTION (no local development environment)
- I explain what I want in product terms, you translate to code
- When something breaks, I send screenshots and error messages
- You push to GitHub → Vercel auto-deploys → I test live

---

## PRODUCT IN ONE SENTENCE
Users upload 3 photos + quotes about someone → AI generates a humorous 8-page "roast book" with illustrations → Free preview (cover + page 1) → $9.99 to unlock full book

---

## COMPLETE TECH STACK

### ❌ WHAT WE'RE **NOT** USING (CRITICAL)
- **NO Lovable** - Pure Next.js, no visual builders
- **NO n8n** - All workflows are Next.js API routes
- **NO external orchestration tools**
- Everything is code-based, hosted on Vercel

### ✅ What We're Actually Using

**Frontend:**
- Next.js 14.2.18 (App Router)
- React 18
- TypeScript
- Tailwind CSS (neo-brutalist design system)
- Framer Motion (animations)
- Lucide React (icons)
- Google Fonts: Syne (headings), Space Grotesk (body)

**Backend:**
- Next.js API Routes (serverless functions on Vercel)
- Supabase (PostgreSQL database + Storage + Auth)
- OpenAI GPT-4o (quote generation)
- OpenAI GPT-4 Vision (photo analysis)
- Google Gemini API (nano-banana-pro model for image generation)
- DALL-E 3 (fallback if Gemini fails)
- Stripe (payments + webhooks)
- PostHog (analytics)

**Hosting:**
- Vercel (production + auto-deploy from GitHub)
- Custom domain connected

**Development Workflow:**
- Claude Code pushes to GitHub
- Vercel auto-deploys to production
- I test on live site via mobile

---

## CRITICAL ARCHITECTURE RULES (MEMORIZE THESE)

### 1. Supabase Client Usage
```
SERVER-SIDE (API routes, server components):
✅ ALWAYS use: supabaseAdmin (from /lib/supabase.ts)
❌ NEVER use: createClient() - it requires cookies/headers

CLIENT-SIDE (React components):
✅ Use: createClient() from @supabase/auth-helpers-nextjs
```

### 2. Next.js API Route Rules
```typescript
// EVERY API route MUST include this:
export const dynamic = 'force-dynamic'

// Why? Prevents caching issues with real-time status polling
```

### 3. Admin Override Rules
- Email: `nadavkarlinski@gmail.com` (me, the founder)
- Behavior:
  - ✅ Follows normal upload/quote flow
  - ✅ Can submit minimum 2 quotes (not forced to 3+)
  - ✅ Skips payment (bypasses Stripe checkout)
  - ✅ Goes straight to full book generation
- Check admin status using: `isAdminUser()` from `/lib/admin.ts`

### 4. OpenAI Safety Filter Rules
```
❌ NEVER use phrases like:
- "reconstruct person"
- "recreate face"
- "replicate appearance"

✅ INSTEAD use:
- "describe the person as a professional photographer would"
- "capture the essence of the person"
```

### 5. Image Generation Reality Check
- **Model:** Google Gemini `nano-banana-pro`
- **Current success rate:** 80-90% (this is GOOD)
- **Historical failure rate:** ~60% (much improved)
- **Important:** Gemini images may not perfectly match uploaded photos
- **This is normal and expected** - don't "fix" unless explicitly asked
- Falls back to DALL-E 3 if Gemini fails

### 6. Error Handling Standards
```typescript
// ALWAYS log with prefixes:
console.log('[API_ROUTE_NAME]', 'Description', data)
console.error('[API_ROUTE_NAME] ERROR:', Object.getOwnPropertyNames(error))

// Show technical details to user (for debugging)
// Don't hide behind generic "something went wrong"
```

### 7. Mobile/iOS Support
```typescript
// ALWAYS use safe area utilities:
- pt-safe (top padding)
- pb-safe (bottom padding)

// In metadata:
viewport: {
  viewportFit: 'cover'
}

// Test on mobile first (my primary testing device)
```

### 8. API Key Management
```typescript
// ALWAYS trim API keys (prevents hidden newline bugs):
const apiKey = process.env.OPENAI_API_KEY?.trim()
const geminiKey = process.env.GEMINI_API_KEY?.trim()

// This fixed a critical production bug
```

---

## DATABASE SCHEMA (Supabase)

### Table: `roast_books`
```sql
id                    uuid PRIMARY KEY
created_at            timestamp
user_id               uuid REFERENCES auth.users

-- Victim info
victim_name           text
victim_image_url      text          -- Supabase Storage path
victim_description    text          -- GPT-4 Vision analysis

-- Content
quotes                text[]        -- Array of quotes
custom_greeting       text | null

-- Generated images
cover_image_url       text
preview_image_urls    text[]        -- First 3 images (cover + 2 pages)
full_image_urls       text[]        -- All 8 images

-- Status tracking
status                enum [
  'uploaded',           -- Initial upload complete
  'analyzing',          -- GPT-4 Vision analyzing photo
  'analyzed',           -- Analysis complete
  'preview_ready',      -- First 3 images generated
  'paid',               -- Payment received
  'generating_images',  -- Generating remaining 5 images
  'complete',           -- All done
  'failed'              -- Something broke
]

-- Payment
stripe_session_id     text | null
stripe_payment_intent text | null

-- Sharing
slug                  text UNIQUE   -- For public URLs
```

### Table: `auth.users`
- Standard Supabase auth table
- Email/password authentication
- Google OAuth (may be configured)

### Storage Bucket: `roast-images`
- Stores uploaded victim photos
- Stores all generated images
- Public read access enabled

---

## USER JOURNEY (The Flow I Test)

### Step-by-Step:
1. **Landing page** (`/`) → Click "Get Started"
2. **Auth** → User logs in/signs up
3. **Upload page** (`/create`) → Upload victim photo
4. **API: Photo analysis** → GPT-4 Vision analyzes face
5. **Quotes page** (`/create/[id]/quotes`) → Enter 3+ quotes
   - Admin (me): Can enter 2+ quotes minimum
   - Regular users: Minimum 3 quotes
6. **API: Preview generation** → Generate cover + 2 images
7. **Preview page** (`/preview/[id]`) → Show flipbook preview
   - Pages 0-1 unlocked (cover + first page)
   - Pages 2-7 locked with blur/paywall
8. **Payment gate:**
   - Admin: Automatically bypassed, jump to step 10
   - Regular users: Click "Unlock Full Book" → Stripe checkout
9. **Stripe payment** → Webhook updates database
10. **API: Full generation** → Generate remaining 5 images
11. **Final book** (`/book/[slug]`) → Instagram Stories-style flipbook
12. **Share** → User gets unique URL to share

---

## FILE STRUCTURE (Where Everything Lives)
```
/app
  /page.tsx                           # Landing page
  /create
    /page.tsx                         # Photo upload
    /[id]/quotes/page.tsx             # Quote input
    /[id]/generating/page.tsx         # Generation progress
  /preview/[id]/page.tsx              # Preview with paywall
  /book/[slug]/page.tsx               # Final flipbook viewer
  /progress/[bookId]/page.tsx         # Real-time status polling
  /dashboard/page.tsx                 # User's book history
  /layout.tsx                         # Root layout

/app/api
  /upload/route.ts                    # Upload photo → Supabase Storage
  /analyze/route.ts                   # GPT-4 Vision analysis
  /generate-quotes/route.ts           # AI quote generation
  /generate-preview/route.ts          # Generate first 3 images
  /generate-remaining/route.ts        # Generate remaining 5 images
  /checkout/route.ts                  # Create Stripe session
  /webhooks/stripe/route.ts           # Handle payment webhooks
  /book/[id]/route.ts                 # Fetch book by ID or slug
  /test-payment/route.ts              # Admin: simulate payment

/lib
  /supabase.ts                        # Supabase client setup
  /supabaseAdmin.ts                   # Server-side admin client
  /auth.ts                            # Auth helpers
  /admin.ts                           # Admin user detection
  /image-generation.ts                # Multi-provider image gen
  /prompt-engineering.ts              # AI prompt templates
  /posthog.ts                         # Analytics
  /hebrew-utils.ts                    # RTL/Hebrew detection
  /utils.ts                           # General utilities

/components
  /ui/                                # Reusable UI components
  /project/IdeaGeneratorModal.tsx     # AI quote assistant
  /flipbook/TheEndPage.tsx            # Final slide with share
  /providers/PostHogProvider.tsx      # Analytics provider
  /layout/                            # Layout components
```

---

## ENVIRONMENT VARIABLES (Vercel)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # For supabaseAdmin

# OpenAI
OPENAI_API_KEY=

# Google Gemini
GOOGLE_AI_API_KEY=                    # For nano-banana-pro

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=                  # Your custom domain

# Admin
ADMIN_EMAILS=nadavkarlinski@gmail.com

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

**Note:** I (founder) CANNOT edit these in Vercel dashboard. You must tell me exact values if they need updating.

---

## KNOWN ISSUES & SOLUTIONS (Production History)

### ✅ FIXED Issues:

**1. API Key Newline Bug (CRITICAL)**
- **Problem:** Environment variables had trailing `\n` characters
- **Error:** "not a legal HTTP header value"
- **Solution:** Added `.trim()` to all API key usage
- **Status:** Fixed, now standard practice

**2. Silent Analysis Failures**
- **Problem:** `/api/analyze` called fire-and-forget, failed silently
- **Result:** `victim_description` stayed NULL → image generation failed
- **Solution:** Made analysis call synchronous with error handling
- **Status:** Fixed

**3. No User Feedback During Generation**
- **Problem:** Users thought app was frozen (generation takes 2-3 minutes)
- **Solution:** Added loading overlays, spinners, progress indicators
- **Status:** Fixed

**4. DALL-E Content Policy Violations**
- **Problem:** DALL-E 3 rejected "roasting" prompts
- **Solution:** Prioritize Gemini nano-banana-pro, DALL-E as fallback
- **Status:** Fixed, 80-90% success rate

### 🔄 Current Limitations (NOT Bugs):

- Image generation takes 2-3 minutes (normal for AI image gen)
- Faces don't always perfectly match uploaded photos (Gemini limitation)
- Polling-based status updates (acceptable, no need for websockets)
- Sequential image generation (could parallelize but works fine)

---

## RECENT MAJOR CHANGES (Context History)

### Hebrew/RTL Localization (Latest)
- Created `/lib/hebrew-utils.ts`
- RTL support across all components
- Hebrew title: "משפטים שלא תשמע את [name] אומר"
- Israeli cultural context in AI prompts
- Auto-detects Hebrew (>30% Hebrew characters)

### Flipbook UI Overhaul
- Instagram Stories-style full-screen viewer
- Tap zones: 30% left = prev, 70% right = next
- Progress bars at top
- Glass-morphism quote overlays
- iOS safe area support
- Removed Swiper library dependency

### Quote Generation Improvement
- "Mortal Enemy" satirical approach
- Character-driven irony (e.g., Rebel → HR Manager voice)
- Cultural archetypes for better humor

---

## HOW I TEST CHANGES (My Validation Process)

### Full Journey Test:
1. Open Chrome mobile (incognito)
2. Go to live production URL
3. Click through entire flow from landing → payment → flipbook
4. Test on iPhone Safari (most users)
5. Check browser console (F12 via remote debugging)
6. Screenshot any errors and send to you

### Quick Smoke Test:
1. Log in as admin (nadavkarlinski@gmail.com)
2. Upload test photo
3. Enter 2 quotes
4. Verify full book generates without payment
5. Check all 8 pages display correctly

### When I Report Bugs:
- I'll send you screenshots
- I'll copy-paste console errors
- I'll export Supabase table data
- I'll describe what I expected vs what happened
- I won't know what the error means (you explain in plain English)

---

## WHEN I SAY "IT'S NOT WORKING"

### You Should Ask Me:
1. **What step were you on?** (upload, quotes, payment, viewing?)
2. **What did you expect to happen?**
3. **What actually happened?** (error, blank screen, stuck loading?)
4. **Can you check browser console?** (F12, any red errors?)
5. **Can you screenshot the Supabase table?** (roast_books table, that book ID)

### I Cannot Answer:
- "What does the error log say?" (I can't access Vercel logs)
- "Can you check the API response?" (I don't know how)
- "What's the database query?" (I'd need to screenshot Supabase)

---

## LOCALIZATION (Hebrew/RTL)

### Detection Logic:
- Uses `isPredominantlyHebrew()` - checks if >30% Hebrew characters
- Each component detects independently (quotes can be mixed language)

### When Hebrew Detected:
- Apply `dir="rtl"` to containers
- Apply `textAlign: "right"` to text
- Use Hebrew book title: "משפטים שלא תשמע את [name] אומר"
- Localize AI prompts with Israeli cultural context

### Hebrew Utilities (`/lib/hebrew-utils.ts`):
- `isPredominantlyHebrew(text)` - Detection function
- `getHebrewBookTitle(name)` - Returns Hebrew title
- `getHebrewPromptInstruction()` - AI prompt modifier

---

## CRITICAL REMINDERS FOR EVERY SESSION

1. **I don't code** - Never assume I can make changes myself
2. **Test in production** - I validate on live site via mobile
3. **Admin = me** - nadavkarlinski@gmail.com bypasses payment
4. **Gemini success rate is 80-90%** - This is good, not broken
5. **Always trim API keys** - Prevents newline bugs
6. **Use supabaseAdmin server-side** - Never createClient()
7. **Mobile-first** - I test on iPhone, most users on mobile
8. **Explain in plain English** - I don't understand technical jargon
9. **Show full files** - I copy-paste, don't understand diffs/patches
10. **Auto-deploy via GitHub** - You push, Vercel deploys, I test

---

## WHAT "DONE" LOOKS LIKE

✅ I can complete full user journey on mobile without errors
✅ Payment goes through in Stripe
✅ Flipbook displays correctly with all 8 pages
✅ Mobile experience doesn't break (iOS safe areas work)
✅ No console errors
✅ I've tested it live and confirmed "it works!!"

---

## GAPS YOU SHOULD ASK ME ABOUT

If you need to know:
- Specific error messages from Vercel logs (I can't access)
- Environment variable values (I can't edit, but can confirm)
- Exact pricing configuration (check Stripe dashboard)
- Database RLS policies (I can screenshot Supabase settings)
- Any feature I haven't explicitly described

**Don't assume - ASK ME in plain English.**