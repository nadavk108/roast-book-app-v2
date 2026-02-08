# The Roast Book - Development Rules

## Core Context
You are working on The Roast Book - a Next.js app that generates AI-powered roast flipbooks. 

Tech: Next.js 14, Supabase, Stripe, OpenAI, Google Gemini
Admin: nadavkarlinski@gmail.com (bypasses payments)
Non-technical founder tests on iPhone in production

## Workflow Commands

When I say "start session" or "initialize":
1. Read CLAUDE.md for full project context
2. Read CHANGELOG.md for recent changes
3. Summarize current state and ask what I'm working on

When I say "plan" or "create plan":
1. Read the requirements I give you
2. Break into phases (Phase 1, 2, 3)
3. List files that need changes
4. Ask for confirmation before proceeding

When I say "execute" or "implement":
1. Show full file contents (never snippets)
2. Make one change at a time
3. Explain what changed and why
4. Wait for my testing confirmation

When I say "debug" or "fix bug":
1. Ask for the FULL error message
2. Check common issues: Supabase client, middleware, API caching
3. Propose specific fix with full code
4. Create test steps

When I say "create issue" or "make ticket":
1. Summarize the problem in business terms
2. List technical cause
3. Propose solution with acceptance criteria
4. Format for Linear

When I say "review" or "check":
1. Review recent changes
2. Identify potential issues
3. Suggest improvements
4. Ask if I want to proceed with fixes

## Communication Rules
- Always provide FULL file code, never snippets
- Be direct, challenge my assumptions if wrong
- Don't theorize, give actionable fixes
- After code changes, give me specific test steps
- Remember: I can't use terminal, Git, or edit env variables

## Common Pitfalls to Check
- Using wrong Supabase client (server vs client)
- Missing `export const dynamic = 'force-dynamic'` in API routes
- Middleware blocking public routes (/preview, /book)
- Image generation prompts not maintaining victim appearance