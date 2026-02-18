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
- Use terminal/command line (except copy-pasting exact commands you give me)
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
A single user uploads 1 photo of a friend + describes their personality traits → AI generates humorous "identity betrayal" quotes + illustrated images → compiled into a shareable 8-page flipbook titled "Things [Name] Would Never Say" → Free preview of 3 pages → $9.99 to unlock full book.

**CRITICAL: This is a SINGLE-CREATOR product. There is NO collaborative flow. No inviting friends. No friends submitting quotes. No voting. The creator does everything themselves.**

---

## COMPLETE TECH STACK

### ❌ WHAT WE'RE **NOT** USING (CRITICAL)
- **NO Lovable** - Pure Next.js, no visual builders
- **NO n8n** - All workflows are Next.js API routes (n8n fully removed)
- **NO external orchestration tools**
- **NO collaborative/social features** - Single creator flow only
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
- OpenAI GPT-4o-mini (quote generation via "identity betrayal" comedy engine)
- OpenAI GPT-4o-mini + Vision API (photo analysis for physical description)
- OpenAI GPT-4o-mini (prompt engineering via "comedy through contradiction" system)
- Google Gemini 3 Pro Image Preview aka `nano-banana-pro` (image generation by editing uploaded photo into new scenes)
- DALL-E 3 (fallback if Gemini fails)
- Stripe (payments + webhooks)
- PostHog (analytics)

**Hosting:**
- Vercel (production + auto-deploy from GitHub)
- Custom domain: theroastbook.com

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
  - ✅ Can submit minimum 1 quote (not forced to 6+)
  - ✅ Skips payment (bypasses Stripe checkout)
  - ✅ Goes straight to full book generation (all images at once)
- Check admin status using: `isAdminUser()` from `/lib/admin.ts`

### 4. Atomic Locks & Race Condition Prevention (CRITICAL)
**Problem:** Multiple API calls could trigger duplicate image generation
**Solution:** Atomic database lock pattern using Supabase

```typescript
// ATOMIC LOCK PATTERN (used in both /api/generate-preview and /api/generate-remaining)
const { data: lockResult } = await supabaseAdmin
  .from('roast_books')
  .update({ status: 'analyzing' })  // Claim the status
  .eq('id', bookId)
  .not('status', 'in', '("analyzing","preview_ready","generating_remaining","complete")')
  .select('id')
  .maybeSingle();

if (!lockResult) {
  // Lock failed - another process is already handling this, return existing data
  return existingImages;
}

// Lock succeeded - proceed with generation
```

**Why This Matters:**
- Prevents duplicate Gemini API calls ($$$)
- Prevents race conditions where multiple processes generate the same image
- Ensures only ONE process can claim generation work
- If lock fails, safely return existing data instead of failing

**File Naming for Safety:**
```typescript
const timestamp = Date.now();
const storagePath = `generated/${book.slug}/preview_${index}_${timestamp}.jpg`;
```
- Timestamp prevents silent overwrites if lock somehow fails
- Each generation creates uniquely named files

### 5. OpenAI Safety Filter Rules
```
❌ NEVER use phrases like:
- "reconstruct person"
- "recreate face"
- "replicate appearance"

✅ INSTEAD use:
- "describe the person as a professional photographer would"
- "capture the essence of the person"
```

### 6. Image Generation Reality Check
- **Model:** Google Gemini 3 Pro Image Preview (`nano-banana-pro`)
- **Method:** Edits the uploaded photo into new scenes (not generating from scratch)
- **Identity preservation:** Gemini receives the original photo + prompt, edits into new scene
- **Orientation:** Images MUST be vertical portrait (9:16). Horizontal outputs break flipbook UX.
- **Variety:** Each image gets an index (0-7) and totalImages count to enforce different outfits, settings, camera angles, and time of day
- **Race condition prevention:** Uses atomic DB locks to prevent duplicate generation
- **File naming:** Includes timestamp to prevent silent overwrites: `preview_{index}_{timestamp}.jpg`
- Falls back to DALL-E 3 if Gemini fails

### 7. Comedy System (TWO LAYERS)
**Quote Generation — "Identity Betrayal":**
- AI flips the friend's real traits into things they'd NEVER say
- Example: pizza lover → "I've been really into clean eating lately"
- Quotes must sound natural, not like joke setups
- Generated by GPT-4o from user-provided personality descriptions
- User traits are saved to database as `victim_traits` for use in image generation

**Quote generation enforces (in this order):**
1. **Trait extraction first** — identify every distinct trait before writing any quote
2. **Maximize variety** — one quote per distinct trait before any trait is reused
3. **Visual action test** — every quote must imply a specific visible action, not an abstract opinion ("Sports is a waste of time" → REJECTED; "Fold laundry? Just throw it in the closet" → ACCEPTED)
4. **Universality test** — no local sports teams, regional celebrities, or cultural references that require geographic context
5. **Reuse rule** — when a trait must be reused, the scenario and action must be completely different from its first quote

**Image Prompts — THREE STYLES (switchable in `lib/prompt-engineering.ts`):**
- **'direct'** (ACTIVE): Shows person doing the opposite of their quote. Uses victim_traits to determine reality.
- **'contradiction'**: Subject sincerely attempts to live up to the quote; reality quietly contradicts them
- **'satirical'**: Archetype-based irony system with bolder social contrast

**All styles follow:**
- Humor = subject vs reality, NOT subject vs society
- **STRICTLY BANNED:** crowds mocking, people laughing/pointing, phones filming, subway humiliation, viral-cringe aesthetics, sexual framing
- Receives `victimTraits`, `imageIndex`, and `totalImages` for better context and variety enforcement

### 8. Victim Traits Flow (IMPORTANT)
**Purpose:** User-provided personality descriptions inform better image generation

**The Flow:**
1. User enters traits on `/create/[id]/quotes` page (textarea)
2. User clicks "Generate Roasts" → traits sent to `/api/generate-quotes`
3. API saves traits to database: `UPDATE roast_books SET victim_traits = ... WHERE id = bookId`
4. API generates quotes using GPT-4o-mini
5. Later, during image generation:
   - `/api/generate-preview` and `/api/generate-remaining` fetch book data (includes victim_traits)
   - `generateVisualPrompt()` receives victimTraits parameter
   - Active prompt style ('direct') uses traits to determine "what they ACTUALLY do"
   - Result: Images show opposite behavior informed by real personality

**Example:**
- User enters: "Always late, hates planning, spontaneous"
- Quote generated: "I scheduled everything for next month already"
- Image prompt uses traits to show: Person frantically rushing, phone showing "10 missed alarms", clock on wall shows they're 2 hours late to their own planning meeting

### 9. Error Handling Standards
```typescript
// ALWAYS log with prefixes:
console.log('[API_ROUTE_NAME]', 'Description', data)
console.error('[API_ROUTE_NAME] ERROR:', Object.getOwnPropertyNames(error))
```

### 10. Mobile/iOS Support
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

### 11. API Key Management
```typescript
// ALWAYS trim API keys (prevents hidden newline bugs):
const apiKey = process.env.OPENAI_API_KEY?.trim()
const geminiKey = process.env.GEMINI_API_KEY?.trim()

// This fixed a critical production bug (auth 3-attempt issue)
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
victim_gender         text          -- 'male', 'female', 'neutral'
victim_image_url      text          -- Supabase Storage path
victim_description    text          -- GPT-4o-mini Vision analysis of physical appearance
victim_traits         text | null   -- User-provided personality traits (saved from quotes page)

-- Content
quotes                text[]        -- Array of exactly 8 quotes (always)
custom_greeting       text | null   -- Personal note added post-payment

-- Generated images
cover_image_url       text
preview_image_urls    text[]        -- First 3 images (free preview)
full_image_urls       text[]        -- All 8 images (always exactly 8)

-- Status tracking
status                enum [
  'uploaded',              -- Photo uploaded
  'analyzing',             -- GPT-4o-mini Vision analyzing photo
  'analyzed',              -- Analysis complete, victim_description stored
  'preview_ready',         -- First 3 images generated (free preview)
  'paid',                  -- Payment received via Stripe
  'generating_remaining',  -- Generating remaining images
  'complete',              -- All images done, book ready
  'failed'                 -- Something broke
]

-- Payment
stripe_session_id     text | null
stripe_payment_intent text | null

-- Sharing
slug                  text UNIQUE   -- For public URLs (/book/[slug])
```

### Storage Bucket: `roast-book-images`
- Stores uploaded victim photos
- Stores all generated images
- Public read access enabled

---

## USER JOURNEY (The Flow I Test)

### 3-Step Flow (User Perspective):

**Step 1/3 — Upload:**
1. User goes to `/create`
2. Enters friend's name and gender
3. Uploads a photo of the friend
4. Clicks Continue → photo is analyzed by GPT-4o-mini Vision
5. Physical description stored as `victim_description`
6. Redirects to quotes page

**Step 2/3 — Describe & Generate Quotes:**
1. User arrives at `/create/[id]/quotes`
2. Sees a large textarea: "Tell us about [Name]"
3. User describes the friend's personality, habits, quirks, obsessions in free text
4. Clicks "Generate Roasts" → GPT-4o-mini generates 8 quotes
5. Traits are saved to database as `victim_traits` (used later for image prompts)
6. Exactly 8 quote cards appear (no checkboxes, no selection - all 8 are always used)
7. User can: tap any quote to edit inline, regenerate all 8, or edit the description
8. Clicks "Generate Full Book" → always sends exactly 8 quotes

**Step 3/3 — Preview & Pay:**
1. System generates 3 preview images
2. User sees flipbook preview at `/preview/[id]`
3. First 3 pages visible, remaining 5 behind paywall blur
4. User clicks "Unlock Full Book" → Stripe checkout ($9.99)
5. After payment: user can add optional personal greeting note
6. Remaining 5 images generate (~2 min wait)
7. Final book at `/book/[slug]` — shareable via unique URL

### Admin Flow (me):
- Same upload + quotes flow
- Always generates exactly 8 quotes (same as regular users)
- Skips payment entirely
- All images generate at once (no preview split)
- Goes straight to complete book
- Has access to Admin Dashboard at `/admin`

---

## FILE STRUCTURE (Where Everything Lives)
```
/app
  /page.tsx                           # Landing page (SEO-optimized)
  /create
    /page.tsx                         # Step 1/3: Photo upload + name + gender
    /[id]/quotes/page.tsx             # Step 2/3: Describe traits → AI generates quotes
    /[id]/generating/page.tsx         # Generation progress screen
  /preview/[id]/page.tsx              # Step 3/3: Preview + paywall + personal note
  /book/[slug]/page.tsx               # Final flipbook viewer (public, no auth needed)
  /progress/[bookId]/page.tsx         # Real-time status polling
  /dashboard/page.tsx                 # User's book history (complete books → /book/slug)
  /admin/page.tsx                     # Admin-only dashboard (funnel, revenue, metrics)
  /examples/page.tsx                  # Example books showcase
  /how-it-works/page.tsx              # How it works page
  /login/page.tsx                     # Auth page
  /privacy/page.tsx                   # Privacy policy
  /terms/page.tsx                     # Terms of service
  /layout.tsx                         # Root layout (SEO metadata + viewport export)

/app/api
  /upload/route.ts                    # Upload photo → Supabase Storage
  /analyze/route.ts                   # GPT-4o-mini Vision analysis
  /generate-quotes/route.ts           # AI quote generation from traits + save victim_traits
  /generate-preview/route.ts          # Generate first 3 images with atomic DB lock
  /generate-remaining/route.ts        # Generate remaining images with atomic DB lock
  /checkout/route.ts                  # Create Stripe session
  /webhooks/stripe/route.ts           # Handle payment webhooks
  /book/[id]/route.ts                 # Fetch book by ID or slug
  /book/[id]/update-greeting/route.ts # Save personal greeting note
  /test-payment/route.ts              # Admin: simulate payment
  /admin/metrics/route.ts             # Admin-only metrics API (funnel, revenue, trends)

/lib
  /supabase.ts                        # Supabase client setup (includes supabaseAdmin)
  /supabase-server.ts                 # Server-side Supabase client
  /auth.ts                            # Auth helpers
  /admin.ts                           # Admin user detection
  /image-generation.ts                # Gemini nano-banana-pro + DALL-E 3 fallback
  /prompt-engineering.ts              # THREE STYLES: 'direct' (active), 'contradiction', 'satirical'
  /posthog.ts                         # Analytics
  /hebrew-utils.ts                    # RTL/Hebrew detection
  /retry.ts                           # Retry logic with context
  /utils.ts                           # General utilities (includes downloadAndUploadImage)

/components
  /ui/                                # Reusable UI components (brutal-button, brutal-badge, etc.)
  /flipbook/TheEndPage.tsx            # Final slide with share buttons
  /providers/PostHogProvider.tsx       # Analytics provider
  /layout/Header.tsx                  # Site header with auth state
  /layout/Footer.tsx                  # Site footer
  /landing/HeroSection.tsx            # Landing page hero
  /landing/FeaturesSection.tsx        # Showcase + testimonials
  /landing/HowItWorksSection.tsx      # 3-step explainer
  /landing/CTASection.tsx             # Bottom CTA
```

---

## ADMIN DASHBOARD (`/admin`)

**Access:** Admin users only (nadavkarlinski@gmail.com)
**Route:** `/admin` (links added to Header mobile + desktop menus)
**API:** `/api/admin/metrics` (returns comprehensive analytics)

### Features:
- **Revenue Cards:** Today, This Week, All Time (excludes admin test books)
- **Conversion Funnel:** Created → Preview → Paid → Complete with percentages
- **14-Day Trend Chart:** Daily created vs paid books visualization
- **Image Generation Stats:** Success rates, avg images per book
- **Recent Books Grid:** Last 25 books with status, thumbnails, click-to-view
- **Unique Users Count:** Total distinct users

### Mobile-First Design:
- Black background with white/yellow accents
- Compact cards optimized for mobile viewing
- Auto-refresh button in header
- Status badges with color coding (analyzing, preview_ready, paid, complete, failed)

---

## ENVIRONMENT VARIABLES (Vercel)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # For supabaseAdmin

# OpenAI
OPENAI_API_KEY=                       # For GPT-4o-mini (quotes, analysis, prompts)

# Google Gemini
GEMINI_API_KEY=                       # For nano-banana-pro image generation

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://theroastbook.com

# Admin
ADMIN_EMAILS=nadavkarlinski@gmail.com

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

---

## KNOWN ISSUES & SOLUTIONS (Production History)

### ✅ FIXED Issues:

**1. API Key Newline Bug**
- Trailing `\n` in env vars caused "not a legal HTTP header value"
- Fixed: Added `.trim()` to all API key usage (now standard practice)

**2. Auth 3-Attempt Bug**
- Google Sign-In required exactly 3 attempts before working
- Root cause: Trailing newline in OAuth callback URL env var
- Fixed: `.trim()` on URL env vars

**3. Silent Analysis Failures**
- `/api/analyze` called fire-and-forget, failed silently
- `victim_description` stayed NULL → image generation failed
- Fixed: Made analysis call synchronous with error handling

**4. Humiliation-Based Image Prompts**
- Old prompt system instructed "social embarrassment," "people judging," "humiliating details"
- Output: creepy images with crowds mocking the subject
- Fixed: Replaced with "comedy through contradiction" system (subject vs reality)

**5. DALL-E Content Policy Violations**
- DALL-E 3 rejected "roasting" prompts
- Fixed: Prioritize Gemini nano-banana-pro, DALL-E as fallback only

**6. Copy/Messaging Misalignment**
- Landing page, examples, footer all referenced "friends submit quotes" and "voting"
- Fixed: Updated all copy to reflect single-creator flow

**7. Race Condition in Image Generation**
- Multiple simultaneous API calls could trigger duplicate image generation
- Fixed: Added atomic database locks using `.not('status', 'in', '(...)').maybeSingle()` pattern
- Now both `/api/generate-preview` and `/api/generate-remaining` check and claim status atomically

**8. Silent File Overwrites**
- Generated images with same index would overwrite each other in storage
- Fixed: File names now include timestamps: `preview_{index}_{timestamp}.jpg`

**9. Quote Padding to 8**
- System forced all books to have exactly 8 quotes by padding with empty strings
- Fixed: Quote count is now variable (6-8), images generated only for user-selected quotes

**10. Image Prompts Missing Context**
- Visual prompts didn't have access to user's trait description, causing generic/mismatched images
- Fixed: `victim_traits` now saved to database and passed to `generateVisualPrompt()`

**11. Complex Quote Selection UX**
- Old quotes page had checkboxes, add/delete buttons, selection count, min/max validation
- Users found the selection UI confusing ("why do I need to deselect quotes?")
- Fixed: Redesigned to show exactly 8 editable cards, no checkboxes or selection logic
- Now: tap any card to edit inline, always sends exactly 8 quotes to generation

### 🔄 Current Limitations (NOT Bugs):
- Image generation takes ~2 minutes for remaining images (normal)
- Faces don't always perfectly match uploaded photos (Gemini limitation)
- Some images may come back landscape despite 9:16 enforcement (Gemini inconsistency)
- Polling-based status updates (acceptable, no need for websockets)

---

## SEO & METADATA

### Layout.tsx includes:
- Rich title with template: "The Roast Book — Personalized AI Roast Gift Book for Friends | $9.99"
- Detailed meta description targeting gift-related search terms
- Keywords array (personalized roast book, AI roast gift, funny personalized gift, etc.)
- OpenGraph and Twitter card metadata
- Schema.org Product structured data (JSON-LD)
- Canonical URL: https://theroastbook.com

### Target Search Phrases:
- "personalized roast book"
- "AI roast gift"
- "funny personalized gift for friend"
- "custom roast gift"
- "funny birthday gift for best friend"

---

## LOCALIZATION (Hebrew/RTL)

### Detection Logic:
- Uses `isPredominantlyHebrew()` - checks if >30% Hebrew characters
- Each component detects independently (quotes can be mixed language)

### When Hebrew Detected:
- Apply `dir="rtl"` to containers
- Apply `textAlign: "right"` to text
- Use Hebrew book title: "משפטים שלא תשמע את [name] אומר/ת"
- Localize AI prompts with Israeli cultural context

### Hebrew Utilities (`/lib/hebrew-utils.ts`):
- `isPredominantlyHebrew(text)` - Detection function
- `getHebrewBookTitle(name)` - Returns Hebrew title
- `getHebrewPromptInstruction()` - AI prompt modifier

---

## CRITICAL REMINDERS FOR EVERY SESSION

1. **I don't code** - Never assume I can make changes myself
2. **Test in production** - I validate on live site via mobile
3. **Admin = me** - nadavkarlinski@gmail.com bypasses payment, has admin dashboard access
4. **Single-creator flow** - NO collaborative features, NO inviting friends
5. **Comedy = contradiction, not humiliation** - Subject vs reality, never crowds mocking
6. **Always trim API keys** - Prevents newline bugs
7. **Use supabaseAdmin server-side** - Never createClient()
8. **Mobile-first** - I test on iPhone, most users on mobile
9. **Images must be 9:16 portrait** - Landscape breaks flipbook
10. **Show full files** - I copy-paste, don't understand diffs/patches
11. **Auto-deploy via GitHub** - You push, Vercel deploys, I test
12. **Atomic locks prevent race conditions** - Always use `.not('status', 'in', ...).maybeSingle()` pattern
13. **Quote count is always exactly 8** - Simplified UX, no variable selection
14. **Victim traits inform image prompts** - Always saved from quotes page, passed to generateVisualPrompt()
15. **Complete books link to /book/slug** - NOT /preview/id (prevents stale ?start=3)

---

## WHAT "DONE" LOOKS LIKE

✅ I can complete full user journey on mobile without errors
✅ Upload → describe traits → AI generates 8 quotes → edit if needed → generate full book → preview → pay → full book
✅ Payment goes through in Stripe
✅ Flipbook displays correctly with all 8 vertical pages
✅ Personal greeting note appears if added
✅ Shared URL works without login
✅ No console errors
✅ I've tested it live and confirmed "it works!!"

---

## WHEN I SAY "IT'S NOT WORKING"

### You Should Ask Me:
1. **What step were you on?** (upload, describe traits, quotes, preview, payment, viewing?)
2. **What did you expect to happen?**
3. **What actually happened?** (error, blank screen, stuck loading?)
4. **Can you check browser console?** (F12, any red errors?)
5. **Can you screenshot the Supabase table?** (roast_books table, that book ID)

### I Cannot Answer:
- "What does the error log say?" (I can't access Vercel logs)
- "Can you check the API response?" (I don't know how)
- "What's the database query?" (I'd need to screenshot Supabase)

---

## GAPS YOU SHOULD ASK ME ABOUT

If you need to know:
- Specific error messages from Vercel logs (I can't access)
- Environment variable values (I can't edit, but can confirm)
- Exact pricing configuration (check Stripe dashboard)
- Database RLS policies (I can screenshot Supabase settings)
- Any feature I haven't explicitly described

**Don't assume - ASK ME in plain English.**