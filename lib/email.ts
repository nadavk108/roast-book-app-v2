import { Resend } from 'resend';

export async function sendUserVideoReadyEmail(params: {
  to: string;
  victimName: string;
  slug: string;
}) {
  const { to, victimName, slug } = params;
  const bookUrl = `https://theroastbook.com/book/${slug}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;overflow:hidden;border:1px solid #333;">
          <tr><td style="background:#FACC15;height:8px;"></td></tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 12px;color:#FACC15;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Video Ready</p>
              <h1 style="margin:0 0 16px;color:#fff;font-size:28px;font-weight:bold;line-height:1.3;">
                Your Roast Book video for ${victimName} is ready!
              </h1>
              <p style="margin:0 0 32px;color:#aaa;font-size:16px;line-height:1.6;">
                Great news! Your Roast Book video is ready to watch.
              </p>
              <a href="${bookUrl}" style="display:block;background:#FACC15;color:#000;text-align:center;padding:16px 24px;border-radius:12px;font-size:16px;font-weight:bold;text-decoration:none;margin-bottom:32px;">
                ▶ Watch Your Video
              </a>
              <p style="margin:0;color:#555;font-size:13px;">The Roast Book Team</p>
            </td>
          </tr>
          <tr><td style="background:#FACC15;height:8px;"></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const resendClient = new Resend((process.env.RESEND_API_KEY || '').trim());
  const { error } = await resendClient.emails.send({
    from: 'The Roast Book <noreply@theroastbook.com>',
    to,
    subject: `Your Roast Book video for ${victimName} is ready! 🎥`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

const resend = new Resend((process.env.RESEND_API_KEY || 'placeholder-resend-key').trim());

export async function sendBookReadyEmail(params: {
  to: string;
  victimName: string;
  slug: string;
  quoteCount: number;
  isHebrew: boolean;
}) {
  const { to, victimName, slug, quoteCount, isHebrew } = params;
  const bookUrl = `https://theroastbook.com/book/${slug}`;

  const subject = isHebrew
    ? `ספר הרוסט של ${victimName} מוכן! 🔥`
    : `Your Roast Book for ${victimName} is ready! 🔥`;

  const label = isHebrew ? 'הספר מוכן' : 'BOOK READY';
  const headline = isHebrew
    ? `משפטים שלא תשמעו את ${victimName} אומר/ת`
    : `Things ${victimName} Would Never Say`;
  const body = isHebrew
    ? `${quoteCount} רוסטים שיגרמו ל${victimName} לפקפק בחברות שלכם. אל תשמרו את היצירה הזו לעצמכם.`
    : `${quoteCount} roasts, ready to make ${victimName} question your friendship. Don't keep this masterpiece to yourself.`;
  const primaryCta = isHebrew ? 'פתחו את ספר הרוסט 🔥' : 'Open Your Roast Book 🔥';
  const secondaryCta = isHebrew ? 'שתפו עם חברים' : 'Share with friends';
  const footer = isHebrew
    ? 'נעשה באהבה ובאפס רגישות - The Roast Book Team'
    : 'Made with love and zero chill - The Roast Book Team';

  const dirAttr = isHebrew ? ' dir="rtl"' : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;overflow:hidden;border:1px solid #333;">

          <!-- Header bar -->
          <tr>
            <td style="background:#FACC15;height:8px;"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 32px;"${dirAttr}>

              <!-- Label -->
              <p style="margin:0 0 12px;color:#FACC15;font-size:13px;letter-spacing:3px;text-transform:uppercase;">
                ${label}
              </p>

              <!-- Title -->
              <h1 style="margin:0 0 16px;color:#fff;font-size:28px;font-weight:bold;line-height:1.3;">
                ${headline}
              </h1>

              <!-- Body -->
              <p style="margin:0 0 32px;color:#aaa;font-size:16px;line-height:1.6;">
                ${body}
              </p>

              <!-- Primary CTA -->
              <a href="${bookUrl}" style="display:block;background:#FACC15;color:#000;text-align:center;padding:16px 24px;border-radius:12px;font-size:16px;font-weight:bold;text-decoration:none;margin-bottom:12px;">
                ${primaryCta}
              </a>

              <!-- Secondary CTA -->
              <a href="${bookUrl}" style="display:block;background:transparent;color:#888;text-align:center;padding:12px 24px;border-radius:12px;font-size:14px;text-decoration:none;border:1px solid #333;margin-bottom:32px;">
                ${secondaryCta}
              </a>

              <!-- Footer -->
              <p style="margin:0;color:#555;font-size:13px;">
                ${footer}
              </p>

            </td>
          </tr>

          <!-- Footer bar -->
          <tr>
            <td style="background:#FACC15;height:8px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const { error } = await resend.emails.send({
    from: 'The Roast Book <noreply@theroastbook.com>',
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

export async function sendVideoReadyEmail(params: {
  victimName: string;
  videoUrl: string;
  bookSlug: string;
  durationSeconds: number;
  generationTimeMs: number;
}) {
  const { victimName, videoUrl, bookSlug, durationSeconds, generationTimeMs } = params;
  const bookUrl = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://theroastbook.com').trim()}/book/${bookSlug}`;
  const genTimeSec = Math.round(generationTimeMs / 1000);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;overflow:hidden;border:1px solid #333;">

          <!-- Header bar -->
          <tr>
            <td style="background:#FACC15;height:8px;"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <!-- Label -->
              <p style="margin:0 0 12px;color:#FACC15;font-size:13px;letter-spacing:3px;text-transform:uppercase;">
                Video Ready
              </p>

              <!-- Title -->
              <h1 style="margin:0 0 24px;color:#fff;font-size:28px;font-weight:bold;line-height:1.3;">
                Things ${victimName} Would Never Say
              </h1>

              <!-- Stats row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#1a1a1a;border-radius:10px;padding:16px;text-align:center;width:48%;">
                    <p style="margin:0;color:#888;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Duration</p>
                    <p style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:bold;">${durationSeconds}s</p>
                  </td>
                  <td width="4%"></td>
                  <td style="background:#1a1a1a;border-radius:10px;padding:16px;text-align:center;width:48%;">
                    <p style="margin:0;color:#888;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Generated in</p>
                    <p style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:bold;">${genTimeSec}s</p>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA -->
              <a href="${videoUrl}" style="display:block;background:#FACC15;color:#000;text-align:center;padding:16px 24px;border-radius:12px;font-size:16px;font-weight:bold;text-decoration:none;margin-bottom:12px;">
                ▶ Watch the Video
              </a>

              <!-- Secondary CTA -->
              <a href="${bookUrl}" style="display:block;background:transparent;color:#888;text-align:center;padding:12px 24px;border-radius:12px;font-size:14px;text-decoration:none;border:1px solid #333;">
                View the Book
              </a>

            </td>
          </tr>

          <!-- Footer bar -->
          <tr>
            <td style="background:#FACC15;height:8px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const { error } = await resend.emails.send({
    from: 'The Roast Book <noreply@theroastbook.com>',
    to: 'nadavkarlinski@gmail.com',
    subject: `🎬 Video ready: Things ${victimName} Would Never Say`,
    html,
  });

  if (error) {
    // Non-fatal — log but don't throw
    console.warn('[EMAIL] Failed to send video-ready email:', error);
  } else {
    console.log(`[EMAIL] ✅ Video-ready email sent for "${victimName}"`);
  }
}
