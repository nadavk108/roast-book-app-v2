import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { createCheckoutSession } from '@/lib/stripe';
import { isAdminUser } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin - admins bypass payment
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isAdminUser(user)) {
      console.log('[ADMIN BYPASS] Admin user attempting checkout - payment not required');
      return NextResponse.json({
        error: 'Admin users do not need to pay',
        bypassPayment: true,
        isAdmin: true,
      }, { status: 403 });
    }

    const { bookId } = await request.json();

    if (!bookId) {
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

    if (fetchError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    if (book.status !== 'preview_ready') {
      return NextResponse.json(
        { error: 'Book not ready for checkout' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession(bookId, book.slug);

    // Update book with session ID
    await supabaseAdmin
      .from('roast_books')
      .update({
        stripe_session_id: session.id,
      })
      .eq('id', bookId);

    return NextResponse.json({
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
