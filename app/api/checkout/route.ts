import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { paddle } from '@/lib/paddle';
import { isAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
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
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.status !== 'preview_ready') {
      console.error('[CHECKOUT API] Book status is:', book.status, 'Expected: preview_ready');
      return NextResponse.json(
        { error: `Book not ready for checkout. Status: ${book.status}` },
        { status: 400 }
      );
    }

    console.log('[CHECKOUT API] Creating Paddle transaction...');

    const transaction = await paddle.transactions.create({
      items: [{ priceId: process.env.PADDLE_PRICE_ID!, quantity: 1 }],
      customData: { bookId, slug: book.slug },
      checkoutSettings: {
        successUrl: `${(process.env.NEXT_PUBLIC_APP_URL || '').trim()}/book/${book.slug}?start=3`,
      },
    });

    console.log('[CHECKOUT API] Paddle transaction created:', transaction.id);

    // Save transaction ID to book
    await supabaseAdmin
      .from('roast_books')
      .update({ paddle_transaction_id: transaction.id })
      .eq('id', bookId);

    console.log('[CHECKOUT API] Success! Checkout URL:', transaction.checkout?.url);

    return NextResponse.json({ checkoutUrl: transaction.checkout?.url });
  } catch (error: any) {
    console.error('[CHECKOUT API] Error:', error);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    );
  }
}
