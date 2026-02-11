import Stripe from 'stripe';

const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();

if (!stripeKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
});

export async function createCheckoutSession(bookId: string, slug: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://theroastbook.com').trim();
  
  const successUrl = `${baseUrl}/preview/${bookId}?payment=success`;
  const cancelUrl = `${baseUrl}/preview/${bookId}?payment=cancelled`;
  
  console.log('[STRIPE] Base URL:', JSON.stringify(baseUrl));
  console.log('[STRIPE] Success URL:', JSON.stringify(successUrl));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'The Roast Book - Full Flipbook',
            description: 'Unlock all 8 roast images',
          },
          unit_amount: 999,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      bookId,
    },
  });

  return session;
}

export default stripe;