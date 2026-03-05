---
name: deploy
description: Deploy The Roast Book to production. Use when the user says deploy, push to production, or ship it.
disable-model-invocation: true
---

# Deploy The Roast Book to Production

## Pre-Deploy Checklist
1. Run `npx tsc --noEmit` and fix ALL errors before proceeding
2. Run `git status` to review all changed files
3. Run `git diff --name-only` to verify only intended files are modified
4. Check: are there any uncommitted changes to protected files?
   - lib/prompt-engineering.ts (needs explicit permission)
   - app/api/webhooks/stripe/route.ts (needs explicit permission)
5. Check: if any new status values were added, was the Supabase constraint updated?

## Deploy Steps
1. Stage changes: `git add <specific files>` (never use `git add .` without reviewing)
2. Commit with a clear message: `git commit -m "<type>: <description>"`
   - Types: feat, fix, refactor, style, perf, chore
3. Push: `git push`
4. Vercel auto-deploys from main branch (takes ~2 minutes)

## Post-Deploy Verification
1. Visit https://theroastbook.com and verify the homepage loads
2. If payment flow was changed: do a test purchase with Stripe test card
3. If image generation was changed: create a test book and verify output
4. If email was changed: trigger a test email and verify delivery
5. Check Vercel function logs for any errors: https://vercel.com/dashboard

## Rollback
If something is broken after deploy:
1. `git revert HEAD` to undo the last commit
2. `git push` to trigger a new deploy with the revert
3. Investigate the issue before re-attempting

## Never Deploy If
- TypeScript compilation has errors
- You changed files outside the intended scope
- Supabase schema changes haven't been applied to production
- You're unsure about the change's impact on the payment flow
