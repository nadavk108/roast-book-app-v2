---
name: roast-book
description: Context and rules for The Roast Book codebase. Use for any code changes, bug fixes, or features in this project.
---

# The Roast Book - Project Skill

## What Is This Product
B2C AI gifting product. Single creator uploads a friend's photo, describes traits, AI generates "Things [Name] Would Never Say" quotes and images compiled into a shareable flipbook. Freemium: 3 preview images free, $9.99 for full 8-image book.

## Tech Stack
- Next.js 14 (App Router), Supabase (DB + storage), Stripe (payments), Vercel (hosting)
- OpenAI GPT-4o-mini (quote generation), Google Gemini 3.1 Flash Image / Nano Banana 2 (image generation)
- Resend (email), Google OAuth (auth)

## Sacred Rules - NEVER Break These
1. NEVER modify lib/prompt-engineering.ts without explicit permission from the user
2. NEVER modify app/api/webhooks/stripe/route.ts without explicit permission
3. Always run `npx tsc --noEmit` after ANY code change
4. Always run `git diff --name-only` to verify only intended files changed
5. One concern per session - do not scope creep
6. Always destructure BOTH {data, error} from Supabase updates - NEVER ignore errors
7. Always .trim() environment variables (Stripe, Supabase, Resend keys)
8. Never use em dashes (—) in user-facing text. Use "-" or "," instead.

## Book Status Flow
analyzing → generating_prompts → generating_images → preview_ready → paid → generating_remaining → complete | failed

## Supabase Status Constraint
```sql
CHECK (status IN ('analyzing', 'generating_prompts', 'generating_images', 'preview_ready', 'paid', 'generating_remaining', 'complete', 'failed'))
```
If you add a new status value, you MUST update this constraint or the DB will silently reject updates.

## Critical Architecture Decisions
- **Post-payment flow**: Preview page polls every 3s until webhook sets status to 'paid', THEN calls /api/generate-remaining. Never fire generation before status is confirmed paid.
- **Atomic locks**: generate-preview and generate-remaining use atomic Supabase updates to prevent duplicate generation. Always check both data AND error.
- **Serverless constraints**: Vercel functions terminate background processes. Generation must be awaited, not fire-and-forget.
- **Image generation**: Gemini uses "edit" mode with the victim's photo as reference. Prompts enforce photorealistic output, no cartoon/clipart.
- **Hebrew support**: RTL detection via isPredominantlyHebrew(). Quote generation uses Hebrew-first prompts, not English translated to Hebrew.

## Key Files (know before you edit)
- `lib/prompt-engineering.ts` - Image prompt generation (PROTECTED)
- `app/api/generate-quotes/route.ts` - Quote generation with GPT-4o-mini
- `app/api/generate-remaining/route.ts` - Post-payment image generation (5 remaining)
- `app/api/generate-preview/route.ts` - Preview image generation (3 images)
- `app/preview/[id]/page.tsx` - Payment return, generation trigger, greeting input
- `app/book/[slug]/page.tsx` - Flipbook viewer
- `app/api/webhooks/stripe/route.ts` - Stripe webhook (PROTECTED)
- `lib/email.ts` - Resend email templates
- `lib/image-generation.ts` - Gemini API calls

## Common Bugs to Avoid
1. **Stripe webhook race condition**: Client must poll until status=paid before calling generate-remaining
2. **Silent Supabase constraint rejection**: Always check error return, not just data
3. **Env var whitespace**: Always .trim() on process.env values
4. **Duplicate generation**: Atomic locks prevent this, but never remove the lock logic
5. **Flipbook image/quote mismatch**: Transition locking prevents rapid swipe desync

## Start Session Protocol
When the user says "start session" or similar:
1. Read `/Users/I754385/Downloads/files/roast-book-app/CLAUDE.md`
2. Read `/Users/I754385/Downloads/files/roast-book-app/CHANGELOG.md`
3. Summarize: last working deploy, what's broken, what's in progress
4. Confirm locked files are understood

## Before ANY Code Change
1. Read CLAUDE.md and CHANGELOG.md and summarize current state
2. Identify exactly which files will be affected
3. Document previously failed approaches before trying new ones
4. Implement the change
5. Run `npx tsc --noEmit`
6. Run `git diff --name-only` to verify scope
7. Commit with descriptive message and push
