# Create Plan Command

Based on our exploration, create a **detailed technical plan** in a markdown file.

## Output Format

Create a file called `PLAN_[FEATURE_NAME].md` with this structure:
```markdown
# [Feature Name] - Implementation Plan

## TL;DR
[2-3 sentence summary of what we're building and why]

## Critical Decisions

### Decision 1: [Title]
**Choice:** [What we decided]
**Why:** [Reasoning]
**Alternative:** [What we rejected and why]

### Decision 2: [Title]
...

## Implementation Plan

### Phase 1: [Name] - Status: ⏳ Not Started
**What:** [What this phase accomplishes]
**Files:**
- `/path/to/file1.ts` - [What changes]
- `/path/to/file2.tsx` - [What changes]

**Steps:**
1. [ ] [Specific task]
2. [ ] [Specific task]
3. [ ] [Specific task]

**Testing:**
- [ ] [How to verify this works]

---

### Phase 2: [Name] - Status: ⏳ Not Started
...

## Edge Cases & Considerations

- [ ] What happens if user does X?
- [ ] How does admin mode behave?
- [ ] What if API fails?
- [ ] Mobile experience considerations

## Rollback Plan

If something goes wrong:
1. [How to undo changes]
2. [What to check in database]
3. [How to notify users if needed]
```

## Plan Requirements

### Each phase should:
- Be independently testable
- Have clear success criteria
- List specific files to change
- Include status tracker (⏳ Not Started / 🏗️ In Progress / ✅ Complete / ❌ Failed)

### Critical Decisions must:
- Explain WHY we chose this approach
- Document alternatives we rejected
- Note any trade-offs

### Testing must include:
- How to manually test
- What to check in database
- Expected behavior vs actual

## After Creating Plan

1. Save the plan file
2. Show me the TL;DR and critical decisions
3. Ask: "Ready to execute this plan?"

## Important Notes

- Be specific (no vague "implement feature X")
- Think about order (what depends on what?)
- Consider rollback (what if it breaks?)
- Update status as we go (I'll tell you when phases complete)

---

Create the plan now based on our exploration discussion.