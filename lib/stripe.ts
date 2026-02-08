import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function createCheckoutSession(bookId: string, slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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
          unit_amount: 999, // $9.99
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/preview/${bookId}?payment=success`,
    cancel_url: `${baseUrl}/preview/${bookId}?payment=cancelled`,
    metadata: {
      bookId,
    },
  });

  return session;
}

export default stripe;