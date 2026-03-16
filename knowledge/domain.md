# Domain Knowledge

## Product

**What it is:** B2C AI gifting product. One person uploads a friend's photo + trait description. AI generates "Things [Name] Would Never Say" quotes + matching images, compiled into a shareable flipbook.

**Pricing:** Freemium — 3 preview images free, $0.99 for full 8-image book.

**Target market:** Israeli users (Hebrew support is a first-class requirement), English users secondary.

---

## Book Status Flow

```
analyzing → generating_prompts → generating_images → preview_ready → paid → generating_remaining → complete | failed
```

**Supabase status constraint (exact values, enforced by DB CHECK):**
```sql
CHECK (status IN ('analyzing', 'generating_prompts', 'generating_images', 'preview_ready', 'paid', 'generating_remaining', 'complete', 'failed'))
```

- `generating_prompts` is used as an atomic lock state in `generate-preview` but may NOT be in the DB constraint — verify before relying on it.
- Adding a new status: update the Supabase CHECK constraint FIRST or updates will silently fail.

---

## DB Schema — roast_books (key columns)

```
id, slug, status, user_email
victim_name, victim_description, victim_image_url, victim_gender
quotes[]
preview_image_urls[]     -- first 3 images (free)
full_image_urls[]        -- all 8 images (paid)
cover_image_url          -- use victim_image_url for cover, NOT full_image_urls[0]
video_status             -- null | processing | complete | failed
video_url, video_generated_at, video_clip_urls[], video_error
```

**Cover image rule:** Use `victim_image_url`, NOT `full_image_urls[0]` — off-by-one bug waiting to happen.

---

## APIs & Services

### Supabase
- **Server-side** (API routes): `supabaseAdmin` from `lib/supabase.ts`
- **Client-side** (React components): `createClient()` from `@supabase/auth-helpers-nextjs`
- Never use `createClient()` server-side — causes silent auth failures.
- Always destructure BOTH `{ data, error }` from updates. Never ignore `error`.

### OpenAI (GPT-4o-mini)
- Used for quote generation only.
- Quote style: "Identity betrayal" — flip a real trait into its opposite (pizza lover → "clean eating").

### Google Gemini — `gemini-2.5-flash-image` ("Nano Banana" / "Nano Banana Pro")
- Primary image generation provider.
- **Edit mode**: uploads victim's photo as reference, edits it into a new scene. NOT text-to-image.
- Every prompt must include `"VERTICAL PORTRAIT ORIENTATION (9:16, taller than wide)"`.
- Each image gets an index (1 of 8) to enforce different outfits/settings/angles/time-of-day.
- Banned repeat settings across a single book: subway, gym, cafe, park.

### OpenAI DALL-E 3
- Fallback when Gemini fails.
- Size: `1024x1792` (portrait 9:16), quality: `hd`, style: `vivid`.

### Stripe
- Payment for full book ($0.99).
- Webhook sets `status = 'paid'`.
- **Race condition**: client must poll until `status = 'paid'` before calling `/api/generate-remaining`. Never fire generation immediately after Stripe redirect.
- Webhook file is LOCKED: `app/api/webhooks/stripe/route.ts`.

### Resend
- Email notifications (purchase confirmation, video ready).

### Hailuo-02 (via fal.ai)
- Animated video clips for the video pipeline (admin-only, Phase 1).
- FAL_KEY format: UUID `xxxx:yyyy` — valid without `fal_live_` prefix.

### Google OAuth
- Auth via Supabase Auth.
- React Strict Mode runs `useEffect` twice — use `useRef(false)` guard in auth callback.
- Always `.trim()` env vars used in OAuth callback URLs — trailing newlines cause failures.

---

## Comedy System

- **Quote layer:** "Identity betrayal" — flip a real trait into its opposite.
- **Image layer:** "Comedy through contradiction" — subject sincerely tries to live the quote; reality contradicts it.
- **Banned in images:** crowds mocking, phones filming, public humiliation, sexual framing.

---

## Hebrew / RTL

- RTL detection: `isPredominantlyHebrew()` in `lib/hebrew-utils.ts`.
- Quote generation uses Hebrew-first prompts (not English translated to Hebrew).
- RTL layout: `flex-row-reverse` for Hebrew text.
- Hebrew title gendering: Male: "אומר", Female: "אומרת" (stored in `victim_gender` column).
- `victim_gender` defaults to neutral/masculine for backwards compatibility.

---

## Video Pipeline (Admin Only — Phase 1)

- **Cost:** ~$3.20/video (9 Hailuo clips @ $0.27 + FFmpeg + merge + music).
- **Duration:** ~81 seconds (3+6 + 8*(3+6)).
- **Pipeline:** quote PNGs → Hailuo animated clips → static clips → merge → music → Supabase upload.
- **Atomic lock:** `video_status`: null/failed → processing → complete/failed.
- Admin check: `isAdminUser()` in `lib/admin.ts` (nadavkarlinski@gmail.com).
- See `memory/video-generation.md` for full details.

---

## Locked Files — Never Modify Without Explicit Permission

- `lib/prompt-engineering.ts` — image prompt system (best-ever results)
- `lib/image-generation.ts` — Gemini API calls (best-ever results)
- `app/api/webhooks/stripe/route.ts` — Stripe webhook (critical for revenue)

---

## Key File Map

```
lib/prompt-engineering.ts        LOCKED — image prompt generation
lib/image-generation.ts          LOCKED — Gemini + DALL-E API calls
lib/fal-client.ts                Hailuo-02 animated clips + FFmpeg
lib/video-generation.ts          6-phase video pipeline
lib/quote-card.ts                sharp+SVG PNG card generator (432x768px)
lib/email.ts                     Resend email templates
lib/retry.ts                     withRetryContext() for external API calls
lib/admin.ts                     isAdminUser() check
lib/hebrew-utils.ts              Hebrew detection + gender-aware titles
app/api/generate-quotes/         GPT-4o-mini quote generation
app/api/generate-preview/        Preview image generation (3 images)
app/api/generate-remaining/      Post-payment image generation (5 images)
app/api/video/generate/          Admin video endpoint, 300s timeout, atomic lock
app/api/admin/metrics/           Admin dashboard data
app/api/webhooks/stripe/         LOCKED — Stripe webhook
app/preview/[id]/page.tsx        Payment return + generation trigger
app/book/[slug]/page.tsx         Flipbook viewer
app/admin/page.tsx               Admin dashboard with video controls
app/create/page.tsx              Photo upload + trait input + gender selector
```

---

## Naming Conventions

- Status values: snake_case strings matching the DB constraint exactly.
- Supabase admin client: always `supabaseAdmin` (not `supabase` or `client`).
- Image prompt index: "1 of 8", "2 of 8", etc. (human-readable, not 0-indexed).

---

## API Route Requirements (Mandatory)

Every API route must have:
```typescript
export const dynamic = 'force-dynamic'
```
Long-running routes (video, generate-remaining) also need:
```typescript
export const maxDuration = 300
```

---

## Known Gotchas

- Vercel serverless: functions terminate background processes. Generation must be `await`ed, never fire-and-forget.
- Env vars: always `.trim()` — trailing newlines cause "not a legal HTTP header value" errors (broke prod 2025-02-03).
- Silent Supabase constraint rejection: always check `error`, not just `data`.
- Duplicate generation: atomic locks in generate-preview and generate-remaining prevent this — never remove the lock logic.
- Flipbook image/quote mismatch: transition locking prevents rapid-swipe desync.
