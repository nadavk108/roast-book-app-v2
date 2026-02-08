# Gender Support & UI Fixes - Implementation Summary

## 🎯 What Was Fixed

### 1. **Gender Support for Hebrew Books**
- Added gender selector during photo upload (Male/Female/Other)
- Hebrew book titles now use correct verb form:
  - **Male**: משפטים שלא תשמע את [name] **אומר**
  - **Female**: משפטים שלא תשמע את [name] **אומרת**
  - **Other/Neutral**: משפטים שלא תשמע את [name] **אומר** (default masculine)

### 2. **Centered All Text in Flipbook**
- Cover title is now centered
- Cover subtitle is now centered
- All quote text is now centered (regardless of language)

### 3. **Cleaned Up Cover UI**
- Removed messy navigation instructions from cover page
- Removed "Tap to continue" and tap direction indicators
- Clean, minimalist cover design

---

## 📝 Files Modified

### Database:
1. **`database-setup.sql`**
   - Added `victim_gender TEXT DEFAULT 'neutral'` column

2. **`supabase/migrations/add_victim_gender.sql`** ✨ NEW FILE
   - Migration script to add gender column to existing database

### Frontend:
3. **`app/create/page.tsx`**
   - Added gender state variable
   - Added 3-button gender selector (Male/Female/Other)
   - Sends gender to upload API

4. **`app/book/[slug]/page.tsx`**
   - Added `victim_gender` to Book type
   - Centered all text (cover title, subtitle, quotes)
   - Removed navigation instructions from cover
   - Passes gender to Hebrew title function

5. **`app/preview/[id]/page.tsx`**
   - Added `victim_gender` to Book type
   - Passes gender to Hebrew title function

6. **`app/create/[id]/quotes/page.tsx`**
   - Passes gender to Hebrew title function

### Backend:
7. **`app/api/upload/route.ts`**
   - Accepts `victimGender` from form data
   - Saves gender to database

### Utilities:
8. **`lib/hebrew-utils.ts`**
   - Updated `getHebrewBookTitle()` to accept optional `gender` parameter
   - Returns gendered verb (אומר/אומרת) based on gender

---

## 🗄️ Database Migration Required

**IMPORTANT:** You need to run this SQL in your Supabase SQL Editor:

```sql
-- Add victim_gender column to existing roast_books table
ALTER TABLE roast_books
ADD COLUMN IF NOT EXISTS victim_gender TEXT DEFAULT 'neutral';

-- Update any existing NULL values to 'neutral'
UPDATE roast_books
SET victim_gender = 'neutral'
WHERE victim_gender IS NULL;
```

This is saved in: `supabase/migrations/add_victim_gender.sql`

---

## ✅ How to Test

### Test 1: Gender Selector (New Books)
1. Go to `/create` (upload page)
2. You should see 3 buttons: **Male | Female | Other**
3. Click each button - it should highlight with yellow background
4. Enter a Hebrew name (e.g., "Asaf" or "Sarah")
5. Upload a photo and continue
6. Complete the flow and view the flipbook
7. **Expected**: Hebrew title should use correct verb form

### Test 2: Centered Text
1. Open any flipbook (`/book/[slug]`)
2. Check the cover page:
   - Title should be centered
   - Subtitle should be centered
   - **No navigation instructions** at the bottom
3. Swipe through quote pages:
   - All quotes should be centered (English or Hebrew)

### Test 3: Existing Books (After Migration)
1. Run the migration SQL in Supabase
2. Open an old Hebrew book
3. **Expected**: Uses default masculine form (אומר) since gender=neutral

### Test 4: Hebrew Female Book
1. Create a new book
2. Enter Hebrew name (e.g., "שרה" / Sarah)
3. Select **Female**
4. Add Hebrew quotes
5. Generate book
6. **Expected**: Title shows "משפטים שלא תשמע את שרה **אומרת**"

---

## 🎨 UI Changes Preview

### Upload Page - Gender Selector
```
Their name: [Asaf________]

Gender (for Hebrew books):
[  Male  ] [  Female  ] [  Other  ]
   ✓ (yellow highlight)

Upload their photo: [...]
```

### Flipbook Cover - Before & After

**Before:**
```
[Photo background]
↓ (messy instructions at bottom)
"Tap to continue ↑"
"← Tap left | Tap right →"
```

**After:**
```
[Photo background]
        Centered Title
    Centered Subtitle
    (clean, no clutter)
```

---

## 🔧 Technical Details

### Gender Values:
- `'male'` → אומר
- `'female'` → אומרת
- `'neutral'` or `undefined` → אומר (default)

### Text Alignment:
- All text uses `text-center` CSS class
- Hebrew text still has `dir="rtl"` for proper RTL rendering
- Quote cards: `text-center` applied to all languages

### Backwards Compatibility:
- Existing books without gender will default to `'neutral'`
- Function signature: `getHebrewBookTitle(name, gender?)`
- Gender parameter is optional (defaults to masculine)

---

## 🚨 Known Limitations

1. **No gender editing**: Once a book is created, gender cannot be changed
   - Solution: Would need to add edit functionality (future feature)

2. **Non-binary representation**: "Other" defaults to masculine form
   - Hebrew grammar limitation - no widely-accepted neutral form
   - Could be addressed with custom text in future

3. **Existing books**: All pre-migration books will use masculine form
   - This is expected behavior
   - Users can create new books with correct gender

---

## 📊 Impact Summary

✅ **User Experience:**
- Cleaner, more professional flipbook cover
- Grammatically correct Hebrew titles
- Better gender inclusivity

✅ **Code Quality:**
- Consistent text centering across all components
- Type-safe gender handling
- Backwards compatible

✅ **Database:**
- Single new column (minimal impact)
- Indexed properly via existing table structure
- Safe migration with defaults

---

## 🎬 Next Steps

1. **Run the database migration** (see SQL above)
2. **Test on production** with a new Hebrew book
3. **Verify old books** still work correctly
4. **Deploy and announce** gender support feature!

---

**Status:** ✅ Ready to Deploy
**Breaking Changes:** None (fully backwards compatible)
**Migration Required:** Yes (one SQL command)
