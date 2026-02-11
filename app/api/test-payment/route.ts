import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    }

    // Update book status to paid
    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        status: 'paid',
        stripe_payment_intent: 'pi_test_manual',
      })
      .eq('id', bookId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Trigger remaining image generation
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://theroastbook.com').trim();
    const generateUrl = `${baseUrl}/api/generate-remaining`;

    const response = await fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Generate-remaining failed:', errorText);
    }

    return NextResponse.json({ success: true, message: 'Book marked as paid and generation triggered' });
  } catch (error) {
    console.error('Test payment error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
