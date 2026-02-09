import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { createCheckoutSession } from '@/lib/stripe';
import { isAdminUser } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('[CHECKOUT API] Request received');

    // Check if user is admin - admins bypass payment
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('[CHECKOUT API] User:', user?.email, 'Admin:', isAdminUser(user));

    if (isAdminUser(user)) {
      console.log('[ADMIN BYPASS] Admin user attempting checkout - payment not required');
      return NextResponse.json({
        error: 'Admin users do not need to pay',
        bypassPayment: true,
        isAdmin: true,
      }, { status: 403 });
    }

    const { bookId } = await request.json();
    console.log('[CHECKOUT API] BookId:', bookId);

    if (!bookId) {
      console.error('[CHECKOUT API] Missing bookId');
      return NextResponse.json(
        { error: 'Missing bookId' },
        { status: 400 }
      );
    }

    // Get book data
    const { data: book, error: fetchError } = await supabaseAdmin
      .from('roast_books')
      .select('*')
      .eq('id', bookId)
      .single();

    console.log('[CHECKOUT API] Book found:', !!book, 'Status:', book?.status);

    if (fetchError || !book) {
      console.error('[CHECKOUT API] Book not found:', fetchError);
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (book.status !== 'preview_ready') {
      console.error('[CHECKOUT API] Book status is:', book.status, 'Expected: preview_ready');
      return NextResponse.json(
        { error: `Book not ready for checkout. Status: ${book.status}` },
        { status: 400 }
      );
    }

    console.log('[CHECKOUT API] Creating Stripe session...');
    // Create Stripe checkout session
    const session = await createCheckoutSession(bookId, book.slug);
    console.log('[CHECKOUT API] Stripe session created:', session.id);

    // Update book with session ID
    await supabaseAdmin
      .from('roast_books')
      .update({
        stripe_session_id: session.id,
      })
      .eq('id', bookId);

    console.log('[CHECKOUT API] Success! Session URL:', session.url);

    return NextResponse.json({
      sessionUrl: session.url,
    });
  } catch (error: any) {
    console.error('[CHECKOUT API] Error:', error);
    console.error('[CHECKOUT API] Error details:', error.message, error.stack);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    );
  }
}
