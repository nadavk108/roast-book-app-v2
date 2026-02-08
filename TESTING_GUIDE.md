# Testing Guide for The Roast Book

## Purpose
This is MY guide (the founder) for testing changes after Claude Code deploys.

---

## 🧪 Full User Journey Test (Do This for Major Changes)

### Setup:
1. Open **Chrome mobile** in **incognito mode**
2. Go to your production domain
3. Make sure you're NOT logged in as admin

### Step-by-Step:
1. **Landing Page**
   - [ ] Page loads correctly
   - [ ] "Get Started" button is visible
   - [ ] Click "Get Started"

2. **Authentication**
   - [ ] Login/signup screen appears
   - [ ] Can log in successfully
   - [ ] Redirects to upload page

3. **Photo Upload**
   - [ ] Upload page loads (URL: `/create`)
   - [ ] Can enter victim's name
   - [ ] Can upload photo (drag-drop or click)
   - [ ] Loading state shows while analyzing
   - [ ] Redirects to quotes page

4. **Quote Input**
   - [ ] Quotes page loads (URL: `/create/[id]/quotes`)
   - [ ] Can enter at least 3 quotes
   - [ ] "Roast Assistant" button works (if tested)
   - [ ] Can submit quotes
   - [ ] Loading state shows while generating preview

5. **Preview Page**
   - [ ] Preview page loads (URL: `/preview/[id]`)
   - [ ] Can see cover image (page 0)
   - [ ] Can see first roast page (page 1)
   - [ ] Pages 2-7 are blurred/locked
   - [ ] "Unlock Full Book" button is visible
   - [ ] Click "Unlock Full Book"

6. **Payment**
   - [ ] Stripe checkout opens
   - [ ] Use test card: `4242 4242 4242 4242`
   - [ ] Expiry: Any future date (e.g., `12/34`)
   - [ ] CVC: Any 3 digits (e.g., `123`)
   - [ ] ZIP: Any 5 digits (e.g., `12345`)
   - [ ] Payment completes successfully
   - [ ] Redirects back to site

7. **Full Book Generation**
   - [ ] Loading state shows "Generating remaining pages..."
   - [ ] Wait 2-3 minutes (this is normal)
   - [ ] Status updates (can check by refreshing or watching spinner)

8. **Final Flipbook**
   - [ ] Book page loads (URL: `/book/[slug]`)
   - [ ] Can see all 8 pages
   - [ ] Can swipe left/right to navigate
   - [ ] Progress bars at top show current page
   - [ ] Quotes display correctly on images
   - [ ] "The End" page appears at end
   - [ ] Share button works

9. **Share Link Test**
   - [ ] Copy the URL
   - [ ] Open in NEW incognito tab
   - [ ] Book loads correctly for anonymous user
   - [ ] Can navigate through all pages

---

## ⚡ Quick Smoke Test (Do This After Small Changes)

### When to use:
- After fixing a specific bug
- After tweaking UI/styling
- After updating a single API route

### Steps:
1. **Admin Test (Fastest)**
   - Log in as `nadavkarlinski@gmail.com`
   - Upload photo
   - Enter 2 quotes
   - Book should generate WITHOUT payment
   - Check all 8 pages appear

2. **Check Specific Feature**
   - Go directly to the page/feature that changed
   - Test the specific behavior
   - Verify fix worked

---

## 📱 Mobile-Specific Tests

### iOS Safari (Primary Device):
1. Open on iPhone
2. Test portrait orientation
3. Check for:
   - [ ] Safe area (no content behind notch)
   - [ ] Smooth swiping
   - [ ] Tap zones work (left = prev, right = next)
   - [ ] Text is readable
   - [ ] Images load correctly

### Android Chrome (Secondary):
1. Test on Android device
2. Check same items as iOS

---

## 🔍 Admin Override Test

### Purpose:
Test without payment, verify admin privileges work

### Steps:
1. Log in with `nadavkarlinski@gmail.com`
2. Upload a photo
3. Enter only 2 quotes (minimum for admin)
4. Submit
5. Should skip payment and generate full book immediately
6. Verify all 8 pages generate
7. Check no payment record in Stripe

---

## 🧨 Error Scenario Tests

### Test What Happens When Things Go Wrong:

**1. Upload Issues:**
- [ ] Try uploading invalid file (PDF, video)
- [ ] Try uploading very large image (>10MB)
- Expected: Clear error message

**2. Quote Issues:**
- [ ] Try submitting only 1 quote (as regular user)
- Expected: Validation error

**3. Payment Issues:**
- [ ] Use test card `4000 0000 0000 0002` (will fail)
- Expected: Error message + retry option

**4. Loading States:**
- [ ] Close browser during generation
- [ ] Reopen and navigate back to book
- Expected: Should resume or show current status

**5. Access Control:**
- [ ] Try accessing someone else's book URL (different user)
- Expected: [Should it work? Or show "not found"?]

---

## 🗄️ Database Verification (When Needed)

### Supabase Table Editor:

**Check `roast_books` table:**
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Select `roast_books`
4. Find your test book (by `victim_name` or recent timestamp)

**Verify these fields:**
- [ ] `status` = "complete" (after full generation)
- [ ] `quotes` = array with correct number of quotes
- [ ] `preview_image_urls` = array with 3 URLs
- [ ] `full_image_urls` = array with 8 URLs
- [ ] `stripe_payment_intent` = filled (if paid user)
- [ ] `slug` = unique value for sharing

**Check `auth.users` table:**
- [ ] Your user exists
- [ ] Email is correct

---

## 🎨 Visual/UI Checks

### Things to Look For:
- [ ] No layout shifts (content jumping around)
- [ ] No overlapping text
- [ ] Images load fully (no broken images)
- [ ] Animations are smooth (not janky)
- [ ] Colors match design (neo-brutalist style)
- [ ] Fonts load correctly (Syne for headings, Space Grotesk for body)

### Hebrew/RTL Tests (If Applicable):
- [ ] Hebrew text displays right-to-left
- [ ] Hebrew quotes in correct direction
- [ ] Title shows "משפטים שלא תשמע את..." for Hebrew books
- [ ] Mixed language (English name + Hebrew quotes) works

---

## 🚨 Where to Look When Things Break

### 1. Browser Console (F12)
**What to look for:**
- Red error messages
- Failed network requests (status 400, 500)
- JavaScript errors

**How to share with Claude:**
- Copy-paste the red error text
- Screenshot the console tab

### 2. Supabase Dashboard
**What to check:**
- Table data (is the book record there?)
- Storage (are images uploaded?)
- Logs (any database errors?)

**How to share with Claude:**
- Screenshot the table row
- Export table as CSV if needed

### 3. Stripe Dashboard
**What to check:**
- Payment succeeded or failed?
- Webhook event delivered?

**How to share with Claude:**
- Screenshot payment record
- Copy payment intent ID

### 4. The Site Itself
**What to describe:**
- What I clicked
- What I expected to see
- What actually happened
- Screenshot of what I see

---

## ✅ Testing Checklist Template

**Copy this for each test session:**
```markdown
## Test Session: [Date] - [What Changed]

**Tested by:** Nadav
**Device:** [iPhone 13 / Desktop / etc.]
**Browser:** [Chrome mobile / Safari / etc.]

### What I Tested:
- [ ] Full user journey
- [ ] Quick smoke test
- [ ] Mobile experience
- [ ] Admin override
- [ ] Specific feature: [describe]

### Results:
- ✅ Working: [list what worked]
- ❌ Issues: [list what broke]
- 🤔 Questions: [anything unclear]

### Next Steps:
[What needs to be fixed or tested next]
```

---

## 🎯 Test Priority Guide

### ALWAYS Test (Critical Path):
1. Can users complete payment?
2. Does the flipbook display after payment?
3. Can the book be shared via link?

### OFTEN Test (Important):
1. Mobile experience (iOS Safari)
2. Admin override works
3. All 8 pages generate correctly

### SOMETIMES Test (Nice to Have):
1. Hebrew/RTL (if relevant to change)
2. Error scenarios
3. Dashboard/history page

---

## 📞 When to Report Issues

**Report immediately if:**
- Payment is broken
- Book doesn't generate after payment
- Site is completely down
- Critical user flow is blocked

**Can wait until next session if:**
- Minor UI glitch
- Typo in text
- Feature enhancement idea
- Nice-to-have improvement

---

**Remember:** I test in production on my phone. I'm the QA team. If I say "it works!!" we're good to go.
```

-