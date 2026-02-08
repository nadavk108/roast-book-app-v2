# Bug Report Checklist

**INSTRUCTIONS:** When something breaks, I fill this out BEFORE contacting Claude Code. This helps us debug faster and saves tokens.

---

## 🎯 What I Was Trying to Do
[Example: "Make a payment for a flipbook"]

---

## ✅ What Steps Worked?
[Example: "Uploaded photo, entered 3 quotes, saw preview"]

---

## 🤔 What Did I Expect to See Next?
[Example: "Payment button should appear"]

---

## ❌ What Actually Happened?
[Example: "Stuck on loading spinner forever, button never appeared"]

---

## 🔍 Browser Console Errors (F12)

**Steps to get console errors:**
1. Open the page where error happens
2. Press F12 (or right-click → Inspect)
3. Click "Console" tab
4. Look for RED error messages
5. Copy-paste below:
```
[Paste console errors here]
```

**Screenshot of console (if helpful):**
[Attach screenshot]

---

## 📊 Supabase Database Check

**For `roast_books` table:**
1. Go to Supabase dashboard
2. Open "Table Editor"
3. Find the book with this ID: [paste ID]
4. Screenshot the row

**Screenshot:**
[Attach screenshot]

**Key values:**
- Status: [e.g., "preview_ready", "paid", "generating_images"]
- Payment Status: [e.g., "unpaid", "paid"]
- Number of quotes: [count]
- Number of preview images: [count]
- Number of full images: [count]

---

## 📱 Device & Browser Info
- Device: [iPhone 13, Samsung Galaxy, Desktop]
- Browser: [Chrome mobile, Safari, Firefox]
- Operating System: [iOS 17, Android 13, macOS]

---

## 🤷 My Best Guess
[Example: "Maybe the payment webhook isn't firing?"]

---

## 🔄 Can I Reproduce It?
- [ ] Yes, happens every time
- [ ] Sometimes (happens X out of Y times)
- [ ] Only happened once

---

## 📸 Screenshots
[Attach any relevant screenshots showing the issue]

---

## ⏱️ When Did This Start?
- [ ] Just now (after latest deployment)
- [ ] Been happening for a while
- [ ] First time I've tried this feature

---

**I send this completed checklist to Claude Code instead of just saying "it's broken"**