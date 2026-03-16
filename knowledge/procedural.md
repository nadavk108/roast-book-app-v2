# Procedural Knowledge

## Session Start Protocol

1. Read `CLAUDE.md`
2. Read `CHANGELOG.md`
3. Read `knowledge/INDEX.md` and load relevant category files
4. Summarize: last working deploy, what's broken, what's in progress
5. Confirm locked files are understood

---

## Before Any Code Change

1. Read `CLAUDE.md` and `CHANGELOG.md` — summarize current state
2. Identify exactly which files will be affected
3. Document previously failed approaches before trying new ones
4. Implement the change
5. Run `npx tsc --noEmit`
6. Run `git diff --name-only` — verify only intended files changed
7. Commit with descriptive message

---

## After Any Code Change

```bash
npx tsc --noEmit          # must pass with zero errors
git diff --name-only      # confirm scope — no unintended files
```

---

## Deploy

```bash
git push                  # Vercel auto-deploys main branch
```

Check Vercel function logs for runtime errors after deploy. Do not assume deploy succeeded — watch for cold start failures and env var issues.

---

## Database Migrations

1. Write migration SQL to `supabase/migrations/<name>.sql`
2. Run in Supabase dashboard SQL editor
3. Verify with a test query
4. Note in CHANGELOG.md

**Adding a new status value:**
```sql
-- Must update the CHECK constraint BEFORE any code uses the new value
ALTER TABLE roast_books DROP CONSTRAINT roast_books_status_check;
ALTER TABLE roast_books ADD CONSTRAINT roast_books_status_check
  CHECK (status IN ('analyzing', 'generating_prompts', 'generating_images',
                    'preview_ready', 'paid', 'generating_remaining',
                    'complete', 'failed', 'YOUR_NEW_STATUS'));
```

---

## Testing Checklist

### New book creation
1. Go to `/create`, upload photo, enter traits, select gender
2. Verify status transitions: analyzing → generating_prompts → generating_images → preview_ready
3. Check 3 preview images render correctly

### Payment flow
1. Complete Stripe checkout (use test card `4242 4242 4242 4242`)
2. Verify redirect to `/preview/[id]`
3. Wait for webhook — page should poll until `status = 'paid'`
4. Confirm generate-remaining fires AFTER status = 'paid'
5. Verify 5 additional images generate, status → complete

### Hebrew book
1. Enter Hebrew name and traits
2. Verify RTL layout in flipbook
3. Check gender-correct verb form in title (אומר vs אומרת)

### Flipbook viewer
1. Cover shows `victim_image_url` (not `full_image_urls[0]`)
2. Tap zones work for navigation
3. Text is centered

---

## Atomic Lock Pattern

```typescript
// Correct pattern — always check BOTH data and error
const { data: lockResult, error: lockError } = await supabaseAdmin
  .from('roast_books')
  .update({ status: 'generating_images' })
  .eq('id', bookId)
  .eq('status', 'generating_prompts')  // only succeeds if currently in expected state
  .select()
  .single();

if (lockError) throw new Error(lockError.message);
if (!lockResult) {
  // Already locked or wrong state — bail out silently
  return;
}
```

---

## Debugging Env Vars

```typescript
// Always log raw value first to reveal hidden chars
console.log('Raw env:', JSON.stringify(process.env.SOME_KEY));
// Then trim:
const key = process.env.SOME_KEY?.trim();
```

---

## Changelog Entry Format

Add to top of CHANGELOG.md under `## Current Status`:

```markdown
## YYYY-MM-DD - [Title]

**Problem:**
[Plain English]

**Solution:**
[Plain English]

**Files Modified:**
- `/path/to/file.ts` - [what changed]

**How to Test:**
1. Step
2. Expected result

**Status:**
- [ ] Deployed
- [ ] Tested
- [ ] Confirmed

**Notes:**
[Edge cases, follow-ups]
```

---

## Video Generation (Admin)

1. Navigate to `/admin`
2. Find book, click "Generate Video"
3. Poll `video_status` — processing → complete (takes ~90s)
4. Video URL appears in admin dashboard when done
5. Email notification sent to admin on completion

**If video gets stuck in `processing`:** check Vercel function logs for FAL API errors. Reset `video_status` to `null` to unlock and retry.

---

## Common Workflows

### Force redeploy (no code change)
```bash
git commit --allow-empty -m "chore: force redeploy"
git push
```

### Check for type errors after change
```bash
npx tsc --noEmit
```

### Verify only intended files changed
```bash
git diff --name-only
git diff --name-only --staged
```
