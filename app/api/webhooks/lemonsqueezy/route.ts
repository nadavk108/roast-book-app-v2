import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');

  if (!signature) {
    console.error('[LemonSqueezy Webhook] Missing x-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  if (digest !== signature) {
    console.error('[LemonSqueezy Webhook] Signature mismatch');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  console.log('[LS WEBHOOK] Full payload:', JSON.stringify(payload, null, 2));
  console.log('[LS WEBHOOK] Event:', payload.meta?.event_name);
  console.log('[LS WEBHOOK] Custom data:', JSON.stringify(payload.meta?.custom_data));
  console.log('[LS WEBHOOK] Order status:', payload.data?.attributes?.status);

  if (
    payload.meta?.event_name === 'order_created' &&
    payload.data?.attributes?.status === 'paid'
  ) {
    const bookId = payload.meta?.custom_data?.bookId;

    if (!bookId) {
      console.error('[LemonSqueezy Webhook] No bookId in custom_data');
      return NextResponse.json({ received: true });
    }

    console.log(`[LemonSqueezy Webhook] Payment completed for book ${bookId}`);

    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        status: 'paid',
        lemonsqueezy_order_id: String(payload.data.id),
      })
      .eq('id', bookId);

    if (updateError) {
      console.error('[LemonSqueezy Webhook] Failed to update book status:', updateError);
      return NextResponse.json({ received: true, error: 'Failed to update book' });
    }

    console.log(`[LemonSqueezy Webhook] Book ${bookId} marked as paid`);
  }

  return NextResponse.json({ received: true });
}
