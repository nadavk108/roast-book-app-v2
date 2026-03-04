import { NextRequest, NextResponse } from 'next/server';
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('paddle-signature');

  if (!signature) {
    console.error('[Paddle Webhook] Missing paddle-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Awaited<ReturnType<Paddle['webhooks']['unmarshal']>>;

  try {
    const paddleClient = new Paddle(process.env.PADDLE_API_KEY!);
    event = await paddleClient.webhooks.unmarshal(
      rawBody,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    );
  } catch (err) {
    console.error('[Paddle Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.eventType === EventName.TransactionCompleted) {
    const data = event.data as any;
    const bookId = data.customData?.bookId;

    if (!bookId) {
      console.error('[Paddle Webhook] No bookId in customData');
      return NextResponse.json({ received: true });
    }

    console.log(`[Paddle Webhook] Payment completed for book ${bookId}`);

    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        status: 'paid',
        paddle_transaction_id: data.id,
      })
      .eq('id', bookId);

    if (updateError) {
      console.error(`[Paddle Webhook] Failed to update book status:`, updateError);
      return NextResponse.json({ received: true, error: 'Failed to update book' });
    }

    console.log(`[Paddle Webhook] Book ${bookId} marked as paid`);
    // Generation is triggered by the client (preview page) on mount - not here.
  }

  return NextResponse.json({ received: true });
}
