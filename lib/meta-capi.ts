import crypto from 'crypto';

const PIXEL_ID = '964256223191066';
const CAPI_URL = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/**
 * Send a server-side Purchase event to Meta Conversions API.
 *
 * The event_id must match the eventID passed to the client-side fbq() call so
 * Meta can deduplicate when both fire for the same transaction.
 *
 * Requires META_CAPI_ACCESS_TOKEN in env (System User token from Meta Events Manager).
 */
export async function sendCapiPurchase({
  eventId,
  email,
  name,
  valueCents,
  currency = 'USD',
}: {
  eventId: string;
  email?: string | null;
  name?: string | null;
  valueCents: number;
  currency?: string;
}): Promise<void> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    console.warn('[CAPI] META_CAPI_ACCESS_TOKEN not set — skipping server-side event');
    return;
  }

  const userData: Record<string, string> = {};
  if (email) {
    userData.em = sha256(email);
  }
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts[0]) userData.fn = sha256(parts[0]);
    if (parts.length > 1) userData.ln = sha256(parts[parts.length - 1]);
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          value: (valueCents / 100).toFixed(2),
          currency: currency.toUpperCase(),
        },
      },
    ],
    access_token: accessToken,
  };

  const res = await fetch(CAPI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error('[CAPI] API error:', JSON.stringify(json));
  } else {
    console.log('[CAPI] Purchase sent — events_received:', json.events_received, 'event_id:', eventId);
  }
}
