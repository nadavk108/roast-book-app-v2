# Admin Mode Documentation

## Overview

Admin mode provides special privileges for the email address `nadavkarlinski@gmail.com`, allowing complete bypass of payment requirements and flexible quote management.

---

## Admin Privileges

### 1. No Payment Required
- ✅ Full access to all generated images without payment
- ✅ No paywall slides in preview/flipbook
- ✅ Checkout API returns bypass response
- ✅ Status goes directly to `complete` (skips `paid` status)

### 2. Flexible Quote Requirements
- ✅ Can create books with **1-8 quotes** (regular users must provide exactly 8)
- ✅ No automatic quote padding/duplication
- ✅ Generates exactly the number of images matching quotes entered
- **Example**: 3 quotes = 3 total images (not forced to 8)

### 3. Immediate Full Generation
- ✅ All images generated immediately (no preview/remaining split)
- ✅ Images saved to `full_image_urls` (not `preview_image_urls`)
- ✅ Status flow: `draft` → `analyzing` → `complete`
- ✅ Skips: `preview_ready`, `paid`, `generating_remaining` statuses

### 4. Visual Indicators
- ✅ **"ADMIN" badge** in navbar (desktop + mobile)
- ✅ **"ADMIN MODE ACTIVE" banner** on quote input page
- ✅ **"ADMIN" badge** in preview flipbook (top-left corner)
- ✅ Button text changes: "Generate Full Book" instead of "Generate Preview"

---

## Implementation Details

### Files Modified

#### 1. `lib/admin.ts` (NEW)
Core admin utility functions:
```typescript
const ADMIN_EMAILS = ['nadavkarlinski@gmail.com'];

export function isAdmin(email: string | null | undefined): boolean
export function isAdminUser(user: User | null | undefined): boolean
export function getAdminStatus(user: User | null | undefined)
export function getMinQuotesRequired(user: User | null | undefined): number
```

#### 2. `components/layout/Header.tsx`
- Checks admin status on mount
- Shows yellow "ADMIN" badge next to user avatar (desktop)
- Shows "ADMIN MODE" banner in mobile menu
- Uses Shield icon from lucide-react

#### 3. `app/create/[id]/quotes/page.tsx`
- Loads user session and checks admin status
- Shows admin banner: "Enter 1-8 quotes. All images will be generated immediately without preview."
- Dynamic minimum quotes: 1 for admin, 8 for regular users
- Skips quote padding logic for admin
- Button text: "Generate Full Book" vs "Generate Preview"
- Status indicator: "${filledCount} quotes added (1-8 allowed)" for admin

#### 4. `app/api/generate-preview/route.ts`
- Checks user admin status via `createClient().auth.getUser()`
- Determines quote generation count:
  - Admin: ALL quotes
  - Regular: First 3 quotes only
- Saves images differently:
  - Admin: `full_image_urls`, status `complete`
  - Regular: `preview_image_urls`, status `preview_ready`
- Logs: `[ADMIN MODE: true]` in console

#### 5. `app/preview/[id]/page.tsx`
- Loads user session and checks admin status
- Shows "ADMIN" badge in top-left corner during preview
- Determines image source:
  - Admin/Paid: `full_image_urls`
  - Regular: `preview_image_urls`
- Skips locked slides for admin
- Shows all available images without paywall

#### 6. `app/api/checkout/route.ts`
- Checks admin status at route entry
- Returns bypass response for admin:
  ```json
  {
    "error": "Admin users do not need to pay",
    "bypassPayment": true,
    "isAdmin": true
  }
  ```
- Regular users proceed to Stripe checkout

---

## Testing Admin Mode

### Prerequisites
1. Sign in with email: `nadavkarlinski@gmail.com`
2. Verify "ADMIN" badge appears in navbar

### Test 1: Flexible Quote Entry
**Steps:**
1. Go to `/dashboard`
2. Click "New Roast Book"
3. Upload a photo
4. Navigate to quotes page
5. **Expected**: See yellow banner: "ADMIN MODE ACTIVE"
6. Enter only 3 quotes (leave others empty)
7. **Expected**: Button enabled with text "Generate Full Book"
8. Click "Generate Full Book"
9. **Expected**: Generates 3 images immediately

**Verification:**
- Check database: `status = 'complete'`
- Check database: `full_image_urls` has 3 URLs
- Check database: `preview_image_urls` is empty or null

### Test 2: Preview Without Paywall
**Steps:**
1. After generation completes, view preview
2. **Expected**: See "ADMIN" badge in top-left
3. Navigate through all slides
4. **Expected**: All 3 quote slides visible, no locked slides
5. **Expected**: No "Unlock Book" button appears

**Verification:**
- All images load correctly
- No payment prompt
- Can navigate all pages freely

### Test 3: Admin Bypass on Checkout
**Steps:**
1. As admin, try to access checkout API directly
2. **Expected**: Returns 403 with bypass message
3. **Expected**: Alert: "Admin users do not need to pay"

### Test 4: Compare with Regular User
**Steps:**
1. Sign out from admin account
2. Sign in as different user (not admin)
3. Create a book
4. **Expected**: Must enter 8 quotes
5. **Expected**: Generates only 3 preview images
6. **Expected**: Preview shows 2 images + locked slides
7. **Expected**: Must pay $9.99 to unlock

---

## Database Behavior

### Admin Book Record
```json
{
  "id": "uuid",
  "user_id": "admin-user-uuid",
  "user_email": "nadavkarlinski@gmail.com",
  "victim_name": "Test Victim",
  "quotes": ["Quote 1", "Quote 2", "Quote 3"],
  "preview_image_urls": [],
  "full_image_urls": [
    "url-to-image-1.jpg",
    "url-to-image-2.jpg",
    "url-to-image-3.jpg"
  ],
  "status": "complete",
  "created_at": "2025-01-15T..."
}
```

### Regular User Book Record
```json
{
  "id": "uuid",
  "user_id": "regular-user-uuid",
  "user_email": "user@example.com",
  "victim_name": "Test Victim",
  "quotes": ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"],
  "preview_image_urls": [
    "url-to-preview-1.jpg",
    "url-to-preview-2.jpg",
    "url-to-preview-3.jpg"
  ],
  "full_image_urls": [],
  "status": "preview_ready",
  "stripe_payment_intent": null,
  "created_at": "2025-01-15T..."
}
```

After payment:
```json
{
  "status": "paid",
  "stripe_payment_intent": "pi_xxxxx",
  "full_image_urls": [
    "url-to-image-1.jpg",
    "url-to-image-2.jpg",
    "url-to-image-3.jpg",
    "url-to-image-4.jpg",
    "url-to-image-5.jpg",
    "url-to-image-6.jpg",
    "url-to-image-7.jpg",
    "url-to-image-8.jpg"
  ]
}
```

---

## Status Flow Comparison

### Admin Flow
```
draft
  ↓
analyzing (saving quotes)
  ↓
generating_prompts (creating visual prompts)
  ↓
generating_images (creating all images)
  ↓
complete ✅ (all images in full_image_urls)
```

### Regular User Flow
```
draft
  ↓
analyzing
  ↓
generating_prompts
  ↓
generating_images (first 3 only)
  ↓
preview_ready (3 images in preview_image_urls)
  ↓
[USER PAYS $9.99]
  ↓
paid
  ↓
generating_remaining (generate images 4-8)
  ↓
complete ✅ (all 8 images in full_image_urls)
```

---

## Security Considerations

### Email-Based Access Control
- Admin check is based on email address only
- Email comparison is case-insensitive
- Admin list is hardcoded in `lib/admin.ts`

### Adding More Admins
To add additional admin users, edit `lib/admin.ts`:
```typescript
const ADMIN_EMAILS = [
  'nadavkarlinski@gmail.com',
  'newadmin@example.com', // Add new admin here
];
```

### No Database Flag
- Admin status is NOT stored in database
- Determined at runtime by checking user email
- Cannot be escalated by database manipulation

---

## Troubleshooting

### Admin Badge Not Showing
**Possible causes:**
1. Not signed in with correct email
2. Email case mismatch (check `lib/admin.ts`)
3. Browser cache - try hard refresh

**Fix:**
- Sign out and sign in again
- Check browser console for `isAdminUser` value
- Verify email in Supabase auth.users table

### Quote Input Still Requires 8 Quotes
**Possible causes:**
1. User session not loaded
2. Admin check failing

**Fix:**
- Check browser console for errors
- Verify `adminMode` variable in component state
- Check `user` object has correct email

### Images Not Generating
**Possible causes:**
1. API route not detecting admin status
2. Database permissions issue

**Fix:**
- Check API logs: should see `[ADMIN MODE: true]`
- Verify `full_image_urls` column exists in database
- Check Supabase service role permissions

### Preview Shows Locked Slides
**Possible causes:**
1. Preview page not detecting admin status
2. Images saved to wrong field

**Fix:**
- Check database: `full_image_urls` should have URLs
- Check preview page console for `adminMode` value
- Verify user is signed in

---

## API Endpoints Affected

### POST /api/generate-preview
- **Checks**: User auth session, admin status
- **Admin behavior**: Generates all images, saves to `full_image_urls`, status `complete`
- **Regular behavior**: Generates 3 images, saves to `preview_image_urls`, status `preview_ready`

### POST /api/checkout
- **Checks**: User auth session, admin status
- **Admin behavior**: Returns 403 with bypass message
- **Regular behavior**: Creates Stripe checkout session

### GET /api/book/[id]
- **No changes**: Returns book data as-is
- **Admin consideration**: Returns `full_image_urls` if populated

---

## Future Enhancements

### Potential Additions
1. **Admin Dashboard**: Special page showing all books across all users
2. **Admin Actions**: Delete any book, regenerate images, manually mark as paid
3. **Admin Analytics**: View generation stats, costs, user activity
4. **Email Whitelist Management**: UI to add/remove admin emails
5. **Granular Permissions**: Different admin roles (super admin, support, etc.)

### Database Schema Additions
Consider adding:
```sql
-- Track admin-created books
ALTER TABLE roast_books
ADD COLUMN is_admin_book BOOLEAN DEFAULT FALSE;

-- Track who created the book
ALTER TABLE roast_books
ADD COLUMN created_by_admin BOOLEAN DEFAULT FALSE;
```

---

## Summary

Admin mode provides a complete bypass of payment and quote limitations for testing, development, and administrative purposes. The implementation is secure, email-based, and easy to extend.

**Key Benefits:**
- ✅ Rapid testing without payment flow
- ✅ Flexible quote counts for demos
- ✅ Full image generation immediately
- ✅ Clear visual indicators
- ✅ No database modifications required

**Current Admin:**
- Email: `nadavkarlinski@gmail.com`
- All privileges enabled
