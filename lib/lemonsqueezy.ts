import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

export function setupLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error('LemonSqueezy error:', error),
  });
}
