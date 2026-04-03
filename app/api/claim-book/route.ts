import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Claims an anonymous book for the authenticated user.
// Called immediately before checkout, after the user signs in.
//
// Logic:
//   - If book.user_id is null: set it to the current user (claim it)
//   - If book.user_id === current user: no-op (already owned)
//   - If book.user_id is a different user: 403 (security violation)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    }

    // Fetch the book to check current ownership
    const { data: book, error: fetchError } = await supabaseAdmin
      .from('roast_books')
      .select('id, user_id, user_email')
      .eq('id', bookId)
      .single();

    if (fetchError || !book) {
      console.error('[claim-book] Book not found:', fetchError);
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Already owned by this user - no-op
    if (book.user_id === user.id) {
      console.log(`[claim-book] Book ${bookId} already owned by user ${user.email}`);
      return NextResponse.json({ success: true, claimed: false });
    }

    // Owned by a different user - reject
    if (book.user_id && book.user_id !== user.id) {
      console.error(`[claim-book] Book ${bookId} belongs to a different user`);
      return NextResponse.json(
        { error: 'This book belongs to another account' },
        { status: 403 }
      );
    }

    // user_id is null - atomically claim it
    // The .is('user_id', null) condition prevents a race condition where two
    // requests try to claim the same book simultaneously.
    const { data: claimResult, error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        user_id: user.id,
        user_email: user.email,
      })
      .eq('id', bookId)
      .is('user_id', null)
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('[claim-book] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!claimResult) {
      // 0 rows updated - another request claimed it between our fetch and update.
      // Re-check to see if it's now ours.
      const { data: recheck } = await supabaseAdmin
        .from('roast_books')
        .select('user_id')
        .eq('id', bookId)
        .single();

      if (recheck?.user_id === user.id) {
        console.log(`[claim-book] Book ${bookId} already claimed by this user (race condition resolved)`);
        return NextResponse.json({ success: true, claimed: false });
      }

      console.error(`[claim-book] Book ${bookId} claimed by another user during race`);
      return NextResponse.json(
        { error: 'This book was just claimed by another account' },
        { status: 409 }
      );
    }

    console.log(`[claim-book] Book ${bookId} claimed by ${user.email}`);
    return NextResponse.json({ success: true, claimed: true });
  } catch (error: any) {
    console.error('[claim-book] Unexpected error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
