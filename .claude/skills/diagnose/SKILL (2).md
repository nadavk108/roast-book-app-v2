---
name: diagnose
description: Diagnose and debug issues in The Roast Book. Use when something is broken, stuck, or not working as expected. Always diagnose before fixing.
---

# Diagnose Before Fixing

CRITICAL: Do NOT jump to a fix. Investigate first. Claude Code has a pattern of guessing at solutions. This skill enforces a diagnosis-first approach.

## Step 1: Understand the Symptom
Ask the user:
- What exactly is happening? (screenshot, error message, behavior)
- What should be happening instead?
- When did it start? (after a specific deploy, change, or randomly)
- Is it reproducible? (every time, sometimes, only on mobile)

## Step 2: Check Logs
1. Vercel function logs: ask user to check https://vercel.com/dashboard for the relevant API route
2. Browser console: ask user to check for errors in browser dev tools
3. Supabase: check the relevant row in roast_books table for status, timestamps, error_message

## Step 3: Trace the Flow
For each type of issue, trace through these files in order:

**Book stuck at "analyzing":**
- app/api/generate-preview/route.ts → check atomic lock, check status constraint
- Check Supabase: is status stuck? What's the error_message column?

**Book stuck after payment (spinner forever):**
- app/preview/[id]/page.tsx → check payment useEffect, check polling logic
- app/api/webhooks/stripe/route.ts → did webhook fire? Check Vercel logs
- app/api/generate-remaining/route.ts → check atomic lock, check status constraint
- Supabase: is status 'paid' or still 'preview_ready'?

**Images not generating or look wrong:**
- lib/prompt-engineering.ts → check the active prompt style
- lib/image-generation.ts → check model string, API errors
- Check Vercel logs for Gemini API error responses

**Auth issues:**
- Check NEXT_PUBLIC_APP_URL env var (must not have trailing whitespace)
- Check Google OAuth redirect URIs in Google Cloud Console

## Step 4: Document Findings
Before proposing any fix, write a summary:
- Root cause: [what is actually wrong]
- Evidence: [logs, DB state, code path that proves it]
- Previously attempted fixes: [what was tried and failed]
- Proposed fix: [what to change and why]

## Step 5: Fix with Minimal Scope
- Change the minimum number of files needed
- Do not refactor unrelated code while fixing a bug
- Test the fix mentally: what happens in the happy path? What about edge cases?
- Run tsc and git diff before committing
