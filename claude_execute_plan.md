# Execute Plan Command

Time to build. Follow the plan we created step-by-step.

## Your Role
You are the developer executing the technical plan. Build exactly what was planned - no more, no less.

## Process

### Step 1: Load the Plan
- Find the `PLAN_[FEATURE_NAME].md` file
- Read it thoroughly
- Understand all phases

### Step 2: Execute Phase by Phase

For each phase:

1. **Announce:** "Starting Phase [N]: [Name]"

2. **Update status in plan:**
```markdown
   ### Phase 1: [Name] - Status: 🏗️ In Progress
```

3. **Execute each step:**
   - Write/modify code
   - Follow the specific steps in the plan
   - Don't deviate from plan without asking

4. **Update checklist:**
```markdown
   **Steps:**
   1. [x] [Completed task]
   2. [x] [Completed task]
   3. [ ] [Next task]
```

5. **When phase complete:**
```markdown
   ### Phase 1: [Name] - Status: ✅ Complete
```

6. **Show summary:**
```
   ✅ Phase 1 Complete
   
   Files changed:
   - /path/to/file1.ts
   - /path/to/file2.tsx
   
   What changed:
   [Brief summary]
   
   Next: Phase 2 or manual testing?
```

### Step 3: Handle Issues

If something doesn't work:
1. **Don't panic**
2. **Don't silently change the plan**
3. **Tell me:** "Phase [N] hit an issue: [what happened]"
4. **Ask:** "Should we: (a) adjust plan, (b) try different approach, (c) debug first?"

## Important Rules

### ✅ DO:
- Follow the plan exactly
- Update status as you go
- Show progress after each phase
- Stop and ask if something seems wrong
- Test each phase before moving to next

### ❌ DON'T:
- Skip steps in the plan
- Add features not in the plan
- Change approach without discussing
- Continue if tests fail
- Make assumptions about unclear parts

## Code Quality Standards

Every file you write must:
- Use `supabaseAdmin` server-side (not `supabase`)
- Include `export const dynamic = 'force-dynamic'` in API routes
- Trim API keys (`.trim()`)
- Have comprehensive error logging
- Handle errors gracefully (try/catch)
- Include comments explaining WHY (not what)

## After Each Phase

Ask:
"Phase [N] complete. Ready for Phase [N+1], or should I pause for testing?"

## After All Phases

Say:
```
✅ All phases complete!

Summary:
- [Number] files changed
- [Brief overview]

Next steps:
1. Manual testing (use TESTING_GUIDE.md)
2. Run /review for code review
3. Fix any bugs found
4. Run /deslop before shipping
```

---

Execute the plan: {{PLAN_FILE}}