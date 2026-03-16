# The Roast Book — Claude Code Context

## LOCKED FILES — DO NOT MODIFY WITHOUT EXPLICIT PERMISSION
These files are working perfectly and must NEVER be changed unless the user explicitly says to:
- lib/prompt-engineering.ts (image prompt generation — current version produces best-ever results)
- lib/image-generation.ts (Gemini API integration — current version produces best-ever results)
- app/api/webhooks/stripe/route.ts (payment webhook — critical for revenue)

If a task seems like it requires changes to these files, STOP and ask the user first. Do not modify them as part of a broader refactor, bug fix, or feature. These files are sacred.

## Tech Stack
- Next.js 14 (App Router), Supabase (DB + storage), Stripe (payments), Vercel (hosting)
- OpenAI GPT-4o-mini (quote generation), Google Gemini 3 Pro Image / Nano Banana Pro (image generation)
- Resend (email), Google OAuth (auth)

## Book Status Flow
analyzing → generating_prompts → generating_images → preview_ready → paid → generating_remaining → complete | failed

## Supabase Status Constraint
CHECK (status IN ('analyzing', 'generating_prompts', 'generating_images', 'preview_ready', 'paid', 'generating_remaining', 'complete', 'failed'))
If adding a new status, update this constraint first or the DB will silently reject updates.

## Critical Rules
1. Always destructure BOTH {data, error} from Supabase updates — NEVER ignore errors
2. Always .trim() environment variables
3. Never use em dashes (—) in user-facing text
4. Post-payment flow: poll until status=paid, THEN call generate-remaining
5. Run npx tsc --noEmit after every change
6. Run git diff --name-only to verify scope before committing
7. One concern per session — do not scope creep

## Key Files
- lib/prompt-engineering.ts — LOCKED — image prompt system
- lib/image-generation.ts — LOCKED — Gemini API calls
- app/api/generate-quotes/route.ts — quote generation
- app/api/generate-remaining/route.ts — post-payment image generation
- app/api/generate-preview/route.ts — preview image generation
- app/preview/[id]/page.tsx — payment return + generation trigger
- app/book/[slug]/page.tsx — flipbook viewer
- app/api/webhooks/stripe/route.ts — LOCKED — Stripe webhook
- lib/email.ts — Resend email templates

## Common Bugs to Avoid
- Stripe webhook race condition: client must poll until status=paid before calling generate-remaining
- Silent Supabase constraint rejection: always check error return, not just data
- Env var whitespace: always .trim() on process.env values
- Duplicate generation: atomic locks prevent this, never remove lock logic

## Learning
Track two types of knowledge:
- Domain: what things are (product context, user preferences, APIs, naming conventions, team decisions)
- Procedural: how to do things (deploy steps, test commands, review flows)

Organize knowledge as a hierarchy of .md files:
- knowledge/INDEX.md routes to categories
- Categories hold the details

Progressive disclosure. Read top-down, only load what you need.

Log errors to knowledge/ERRORS.md:
- Deterministic errors (bad schema, wrong type, missing field) — conclude immediately
- Infrastructure errors (timeout, rate limit, network) — log, no conclusion until pattern emerges
- Conclusions graduate into the relevant domain or procedural file

Actively manage the knowledge system:
- Review knowledge files at the start of each session
- Merge overlapping categories
- Split files that grow too long
- Remove knowledge that's no longer accurate
- Propose edits to CLAUDE.md when you notice something missing — don't wait to be asked
