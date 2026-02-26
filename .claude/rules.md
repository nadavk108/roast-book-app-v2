# The Roast Book - Claude Code Rules

## What We're Building
The Roast Book (theroastbook.com) is a B2C gifting product. A single user creates a personalized comedy flipbook about a friend — "Things [Name] Would Never Say."

**Core flow:** Upload friend's photo + describe their personality traits → AI generates roast quotes → AI generates illustrated images showing person doing things they'd NEVER do → shareable digital flipbook.

**Business model:** Freemium. 3 images free to preview, $9.99 via Stripe unlocks all 8.

**Comedy philosophy:** "Comedy through contradiction" — the humor comes from showing the person LITERALLY doing what the quote says, which contradicts their real personality. NOT humiliation, NOT crowds mocking them. The subject is in on the joke.

## Critical Operator Constraints
- I am a non-technical founder. I CANNOT use terminal, Git, run scripts, or edit environment variables directly.
- I test everything on iPhone in production.
- All fixes must be deployable by Vercel auto-deploy (push to main = deploy).
- If your solution requires terminal commands, it is not a valid solution for me.

## Tech Stack & Architecture
- **Frontend/Backend:** Next.js 14 (App Router)
- **Database & Storage:** Supabase (images stored in Supabase Storage, data in Postgres)
- **Payments:** Stripe (webhook at /api/stripe/webhook)
- **Auth:** Google OAuth via Supabase Auth
- **Hosting:** Vercel
- **Quote generation:** OpenAI GPT-4o-mini
- **Image generation:** Gemini 3 Pro Image Preview — edits uploaded photo into comedic scene
- **Orchestration:** Next.js API routes (n8n was fully removed)

**Key files:**
- `lib/prompt-engineering.ts` — image generation prompts. Treat as sacred.
- `lib/hebrew-utils.ts` — Hebrew language support
- `app/layout.tsx` — SEO metadata + Schema.org structured data. Don't touch structure.
- `app/api/generate-images/` — image generation pipeline
- `app/api/stripe/` — payment handling

## Admin
- nadavkarlinski@gmail.com bypasses payment (admin account for testing)

## Protected Files — Do Not Modify Without Explicit Instruction
- `lib/prompt-engineering.ts`
- `app/layout.tsx`
- Any Supabase migration files

## Workflow Commands

**"start session"** → Read CLAUDE.md + CHANGELOG.md, summarize current state, ask what we're working on today.

**"plan [task]"** → Break into numbered phases, list exact files changing, ask for confirmation before writing any code.

**"execute"** → Implement the confirmed plan. Full file contents only, never snippets. One file at a time. Wait for my test confirmation between files.

**"debug [issue]"** → Ask for full error message first. Check common pitfalls below. Propose fix with full code + test steps.

**"create issue"** → Format for Linear: business problem, technical cause, proposed solution, acceptance criteria.

## Code Rules
- ALWAYS provide complete file contents. Never snippets, never "// rest of file stays the same"
- One change at a time — don't batch unrelated fixes
- After every change, give me 3 specific things to test on my iPhone
- If something requires a terminal command, say so upfront and offer an alternative

## Common Pitfalls
- Wrong Supabase client (server vs client-side) — check import source
- Missing `export const dynamic = 'force-dynamic'` in API routes that read headers/cookies
- Middleware blocking public routes (/preview, /book, /share) — check middleware.ts matcher
- Image prompts losing the subject's face/appearance — identity preservation is critical
- Race conditions in image generation — atomic DB locks exist for a reason, don't remove them
- Hebrew quotes: generate in Hebrew first, never translate from English