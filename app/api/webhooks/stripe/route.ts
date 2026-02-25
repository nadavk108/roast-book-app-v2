import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import stripe from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookId = session.metadata?.bookId;

    if (!bookId) {
      console.error('[Webhook] No bookId in session metadata');
      return NextResponse.json({ received: true });
    }

    console.log(`[Webhook] Payment successful for book ${bookId}`);

    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        status: 'paid',
        stripe_payment_intent: session.payment_intent as string,
      })
      .eq('id', bookId);

    if (updateError) {
      console.error(`[Webhook] Failed to update book status:`, updateError);
      return NextResponse.json({ received: true, error: 'Failed to update book' });
    }

    console.log(`[Webhook] Book ${bookId} marked as paid`);

    // Fire-and-forget — do NOT await; webhook must return 200 to Stripe immediately.
    // generate-remaining runs as its own serverless function with maxDuration=300.
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://theroastbook.com').trim();
    const generateUrl = `${baseUrl}/api/generate-remaining`;

    console.log(`[Webhook] Firing generate-remaining (no-wait): ${generateUrl}`);

    fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId }),
    }).catch(err => {
      console.error(`[Webhook] Error triggering generate-remaining:`, err);
    });
  }

  return NextResponse.json({ received: true });
}