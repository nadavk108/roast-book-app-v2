import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { setupLemonSqueezy } from '@/lib/lemonsqueezy';
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
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

    console.log('[CHECKOUT API] Creating LemonSqueezy checkout...');

    setupLemonSqueezy();

    const checkout = await createCheckout(
      process.env.LEMONSQUEEZY_STORE_ID!,
      process.env.LEMONSQUEEZY_VARIANT_ID!,
      {
        checkoutOptions: {
          embed: false,
        },
        checkoutData: {
          custom: {
            bookId,
            slug: book.slug,
          },
        },
        productOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${book.slug}?start=3`,
          receiptLinkUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${book.slug}?start=3`,
        },
      }
    );

    console.log('[CHECKOUT API] LS response:', JSON.stringify(checkout, null, 2));
    console.log('[CHECKOUT API] LS errors:', checkout.error);

    if (!checkout.data) {
      throw new Error(`LemonSqueezy returned no data. Full response: ${JSON.stringify(checkout, null, 2)}`);
    }

    console.log('[CHECKOUT API] LemonSqueezy checkout created:', checkout.data.data.id);

    const checkoutUrl = checkout.data.data.attributes.url;

    if (!checkoutUrl) {
      console.error('[CHECKOUT API] No checkout URL in response:', JSON.stringify(checkout, null, 2));
      return NextResponse.json({ error: 'Failed to get checkout URL' }, { status: 500 });
    }

    // Save checkout ID to book
    await supabaseAdmin
      .from('roast_books')
      .update({ lemonsqueezy_checkout_id: checkout.data?.data.id })
      .eq('id', bookId);

    console.log('[CHECKOUT API] Success! Checkout URL:', checkoutUrl);

    return NextResponse.json({ checkoutUrl });
  } catch (error: any) {
    console.error('[CHECKOUT API] Error:', error);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    );
  }
}
