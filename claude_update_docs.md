# Update Documentation Command

We just finished building a feature. Update project documentation so future work is easier.

## Your Task

Review what we built and update these files:

### 1. CHANGELOG.md

Add an entry:
```markdown
## 2025-02-[DATE] - [Feature Name]

**Problem:**
[What was broken or needed - plain English]

**Solution:**
[What we built - plain English]

**Files Modified:**
- `/path/to/file1.ts` - [What changed]
- `/path/to/file2.tsx` - [What changed]

**How to Test:**
1. [Step-by-step testing instructions]
2. [Expected result]

**Status:**
- [x] Deployed to production
- [x] Tested by founder
- [x] Confirmed working

**Notes:**
[Any gotchas, limitations, or follow-up needed]
```

### 2. AI-Native Documentation

Check if we need to update `/docs/for-ai/` files:

**If we touched payments:**
→ Update `/docs/for-ai/PAYMENTS.md`

**If we touched image generation:**
→ Update `/docs/for-ai/IMAGE_GENERATION.md`

**If we created a new system:**
→ Create `/docs/for-ai/[SYSTEM_NAME].md`

Each AI doc should include:
- How the system works
- Critical rules (what NOT to do)
- Common mistakes section
- Files involved
- Last updated date

### 3. CLAUDE_CONTEXT.md (If Needed)

Update if we:
- Changed core architecture
- Added new critical patterns
- Fixed a major bug that revealed missing context
- Changed tech stack

### 4. claude_rules.md (If Needed)

Update if we:
- Discovered a new best practice
- Found a common mistake pattern
- Changed how we handle something

## What to Document

### Document These:
- **Gotchas:** "Always check X before doing Y"
- **Common mistakes:** "Don't do X, it causes Y"
- **Non-obvious decisions:** "We chose X over Y because..."
- **Edge cases:** "If user does X, make sure to..."
- **Integration points:** "This connects to X system via..."

### Don't Document:
- Obvious stuff ("API routes handle requests")
- Implementation details that change often
- Temporary workarounds (fix them instead)
- Things already in the code comments

## Process

### Step 1: Review What We Built
- Look at all files changed
- Understand what's new/different
- Identify what future-you needs to know

### Step 2: Update CHANGELOG.md
- Always do this (it's the history)
- Make it helpful for future debugging

### Step 3: Check AI Docs
- Does anything need updating?
- Did we change how a system works?
- Did we find a new pattern/mistake?

### Step 4: Summary
Tell me what you updated:
```
✅ Documentation Updated

- CHANGELOG.md: Added entry for [feature]
- /docs/for-ai/[FILE]: Updated [what changed]
- CLAUDE_CONTEXT.md: [Updated/No changes needed]
- claude_rules.md: [Updated/No changes needed]

Key additions:
- [Important thing future-you should know]
- [Common mistake to avoid]
```

## Why This Matters

Good documentation means:
- ✅ Future features build on past work
- ✅ Mistakes don't repeat
- ✅ New AI sessions have context
- ✅ Debugging is faster
- ✅ You learn and compound knowledge

Bad documentation means:
- ❌ Repeating same bugs
- ❌ Rebuilding what already works
- ❌ Long explanations every session
- ❌ Confusion about "why did we do it this way?"

## After Documentation

Say:
"Docs updated. [Feature name] is now properly documented for future work."

---

Update documentation based on what we just built.
```

---

## ✅ Complete File List (All 12 Files)

### Core Workflow (You MUST have these):
1. ✅ `claude_create_issue.md` - Capture ideas
2. ✅ `claude_exploration_phase.md` - Understand before building
3. ✅ `claude_create_plan.md` - Architect the solution
4. ✅ `claude_execute_plan.md` - Build it
5. ✅ `claude_review.md` - Check your work

### Advanced Workflow (Highly recommended):
6. ✅ `claude_peer_review.md` - Multi-model review
7. ✅ `claude_learning_opportunity.md` - Learn concepts
8. ✅ `claude_deslop.md` - Remove AI sloppiness
9. ✅ `claude_postmortem.md` - Learn from mistakes
10. ✅ `claude_update_docs.md` - Keep docs fresh

### AI-Native Documentation:
11. ✅ `/docs/for-ai/IMAGE_GENERATION.md`
12. ✅ `/docs/for-ai/PAYMENTS.md`

---

## 🎯 Zevi's Complete Workflow (Now Clear)
```
1. 💡 Idea → /create_issue (Linear)
2. 🔍 Pick up issue → /exploration_phase (understand deeply)  
3. 📋 Understand → /create_plan (architect solution)
4. 🏗️ Build → /execute_plan (implement step-by-step)
5. 👀 Done building → /review (self-review)
6. 👥 Review done → /peer_review (multi-model review)
7. 🧹 Reviews done → /deslop (clean up slop)
8. 📚 Ship it → /update_docs (document lessons)
9. 🔄 Bug found? → /postmortem (learn & prevent)
10. ❓ Confused? → /learning_opportunity (understand)