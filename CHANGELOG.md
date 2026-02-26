# The Roast Book - Change Log

## Purpose
This file tracks all changes made by Claude Code. Each entry includes what changed, why, and how to test it.

---
## Current Status (update this section every session)

**Last working deploy:** 2026-02-26 (latest commit: `19102a5` — ban clipart from image prompts)
**Currently broken:** Nothing known. Post-payment stuck loader was fixed (webhook race condition + missing DB constraint). RTL rendering fixed. Clipart banned from prompts.
**In progress:** Uncommitted session — flipbook image preloading + nav debounce (UX), belt-and-suspenders generation retry from progress page (reliability), tighter atomic lock in generate-preview.
## [DATE] - [Brief Title]

**Problem:**
[What was broken or needed - in plain English]

**Solution:**
[What was changed - in plain English]

**Files Modified:**
- `/path/to/file1.ts` - [What changed]
- `/path/to/file2.tsx` - [What changed]

**How to Test:**
1. [Step-by-step testing instructions]
2. [Expected result]

**Status:**
- [ ] Deployed to production
- [ ] Tested by founder
- [ ] Confirmed working

**Notes:**
[Any edge cases, known limitations, or follow-up needed]

---

## Template for Claude Code

**Every time you make changes, add an entry above using this format:**
```markdown
## 2025-02-08 - [Title]

**Problem:**
[Plain English]

**Solution:**
[Plain English]

**Files Modified:**
- `/path` - [change]

**How to Test:**
1. Step
2. Step

**Status:**
- [ ] Deployed
- [ ] Tested
- [ ] Confirmed

**Notes:**
[Any additional context]
```

---

## 2026-02-08 - Gender Support + Centered Text + Clean Cover UI

**Problem:**
1. Hebrew book titles always used masculine form (אומר) even for women
2. Flipbook text was left-aligned instead of centered
3. Cover page had messy navigation instructions cluttering the design

**Solution:**
1. Added gender selector during photo upload (Male/Female/Other)
2. Centered all text in flipbook (title, subtitle, quotes)
3. Removed navigation instructions from cover for cleaner UI

**Files Modified:**
- `/database-setup.sql` - Added victim_gender column
- `/supabase/migrations/add_victim_gender.sql` - Migration for existing DB
- `/app/create/page.tsx` - Added gender selector UI
- `/app/api/upload/route.ts` - Save gender to database
- `/lib/hebrew-utils.ts` - Gender-aware Hebrew titles (אומר/אומרת)
- `/app/book/[slug]/page.tsx` - Centered text + clean cover
- `/app/preview/[id]/page.tsx` - Pass gender to Hebrew title
- `/app/create/[id]/quotes/page.tsx` - Pass gender to Hebrew title

**How to Test:**
1. **Run SQL migration first** (see `supabase/migrations/add_victim_gender.sql`)
2. Go to `/create` and create a new book
3. Select gender (Male/Female/Other)
4. For Hebrew names, verify correct verb form in title:
   - Male: "משפטים שלא תשמע את [name] אומר"
   - Female: "משפטים שלא תשמע את [name] אומרת"
5. View flipbook - all text should be centered
6. Cover page should be clean (no tap instructions)

**Status:**
- [ ] SQL migration run in Supabase
- [ ] Deployed to production
- [ ] Tested with Hebrew male name
- [ ] Tested with Hebrew female name
- [ ] Confirmed working

**Notes:**
- Fully backwards compatible (existing books default to neutral/masculine)
- Gender selector is 3 clean buttons with neo-brutalist design
- See `GENDER_AND_CENTERING_UPDATE.md` for full details

---

## Recent Changes (Pre-Context-Files)

### 2025-02-06 - Hebrew/RTL Localization
**Problem:** App only worked in English, Israeli users needed Hebrew support

**Solution:** Added Hebrew detection and RTL layout support across all components

**Files Modified:**
- `/lib/hebrew-utils.ts` - Created utilities for Hebrew detection
- `/app/book/[slug]/page.tsx` - Added RTL support to flipbook
- `/app/create/[id]/quotes/page.tsx` - RTL quote input
- `/components/project/IdeaGeneratorModal.tsx` - RTL AI assistant

**Status:** ✅ Deployed and tested

---

### 2025-02-05 - Flipbook UI Overhaul
**Problem:** Flipbook felt clunky, not mobile-optimized

**Solution:** Complete rewrite with Instagram Stories-style experience

**Files Modified:**
- `/app/book/[slug]/page.tsx` - Full rewrite

**Features Added:**
- Tap zones for navigation
- Progress bars at top
- Glass-morphism overlays
- iOS safe area support

**Status:** ✅ Deployed and tested

---

### 2025-02-04 - Quote Generation Improvement
**Problem:** AI quotes felt flat and not funny enough

**Solution:** Changed from "opposite-day" to "Mortal Enemy" satirical approach

**Files Modified:**
- `/app/api/generate-quotes/route.ts` - Updated prompts

**Status:** ✅ Deployed and tested

---

### 2025-02-03 - API Key Newline Bug Fix (CRITICAL)
**Problem:** Production completely broken - "not a legal HTTP header value" errors

**Solution:** Added .trim() to all API key usage

**Files Modified:**
- All API routes using OpenAI or Gemini

**Status:** ✅ Fixed in production

---