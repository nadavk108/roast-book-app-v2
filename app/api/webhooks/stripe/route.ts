import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// TODO: Stripe migration in progress — implement full webhook handler with stripe SDK
// when STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are configured on Vercel.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Placeholder — signature verification and event handling to be implemented
  // once stripe package is installed and env vars are set.
  console.log('[Stripe Webhook] Received event (migration in progress)');

  return NextResponse.json({ received: true });
}
