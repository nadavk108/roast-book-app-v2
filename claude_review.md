# Review Command

You just finished building a feature. Now **critically review your own work** before shipping.

## Your Role
You're the tech lead reviewing code before it goes to production. Be thorough and honest.

## Review Process

### Step 1: Code Quality Check

Review all files you changed and check for:

**Critical Issues:**
- [ ] Security vulnerabilities (exposed secrets, SQL injection, XSS)
- [ ] Data loss risks (missing error handling, unprotected deletes)
- [ ] Race conditions (concurrent requests, database updates)
- [ ] Memory leaks (event listeners, intervals not cleaned up)

**High Priority:**
- [ ] Missing error handling (try/catch blocks)
- [ ] Poor error messages (generic vs helpful)
- [ ] Database queries without error checks
- [ ] API calls without timeout/retry logic
- [ ] Missing admin bypass checks
- [ ] Incorrect Supabase client (supabaseAdmin vs supabase)
- [ ] Missing `dynamic = 'force-dynamic'` in API routes

**Medium Priority:**
- [ ] Inconsistent naming (follow project conventions)
- [ ] Missing comments on complex logic
- [ ] Console.logs without context
- [ ] Hardcoded values that should be env vars
- [ ] Duplicate code (should be extracted)

**Low Priority (Nice to Have):**
- [ ] Could be more concise
- [ ] Could be more readable
- [ ] Could have better variable names

### Step 2: Logic Check

Think through the user flow:

1. **Happy path:** Does it work when everything goes right?
2. **Error path:** What happens if API fails? Network timeout? Invalid input?
3. **Edge cases:** Empty data? Max limits? Concurrent requests?
4. **Admin path:** Does admin bypass work correctly?
5. **Mobile:** Will this work on mobile? Safe areas? Touch targets?

### Step 3: Integration Check

How does this interact with existing code?

- [ ] Database schema changes (migrations needed?)
- [ ] Breaking changes (will old data still work?)
- [ ] API contract changes (frontend needs updates?)
- [ ] Dependent features (what else uses this?)

### Step 4: Output Your Review

Format your findings:
```
## Code Review Results

### Critical Issues (Must Fix) 🚨
[None found / List issues]

### High Priority Issues ⚠️
[None found / List issues]

### Medium Priority Issues 📋
[None found / List issues]

### Low Priority (Optional) 💡
[Suggestions for improvement]

### What I Verified ✅
- [What I checked and confirmed working]

### What I'm Uncertain About 🤔
- [Things I want the founder to manually test]
```

## Review Standards

### For Each Issue Found:
```
**Issue:** [Description]
**Location:** `/path/to/file.ts:line_number`
**Risk:** Critical/High/Medium/Low
**Why it's a problem:** [Explanation]
**How to fix:** [Specific solution]
```

### Be Specific:

❌ **Bad:** "Error handling could be better"
✅ **Good:** "In `/app/api/payment/route.ts:45`, if Stripe API fails, we return 500 but don't log the error. Add try/catch with detailed logging."

❌ **Bad:** "This might not work on mobile"
✅ **Good:** "The button at line 23 needs `pt-safe` and `pb-safe` classes for iOS notch support."

## Important Mindset

- **Be critical** - This is your last chance to catch bugs
- **Be honest** - Don't downplay issues
- **Be specific** - Vague feedback doesn't help
- **Be practical** - Focus on what matters for production

## After Review

If you found critical or high priority issues:
"I found [N] issues that should be fixed before shipping. Should I fix them now?"

If only medium/low priority:
"Code looks good. [N] minor suggestions if you want to polish before shipping."

---

Begin comprehensive code review now.