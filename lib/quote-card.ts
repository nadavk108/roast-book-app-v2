import sharp from 'sharp';
import { supabaseAdmin } from './supabase';

const CARD_WIDTH = 432;
const CARD_HEIGHT = 768;

/**
 * Wrap text into lines of at most maxChars characters, breaking at word boundaries.
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Build SVG tspan elements for multiline text, centered vertically around startY.
 */
function buildTspans(lines: string[], x: number, startY: number, lineHeight: number): string {
  return lines
    .map(
      (line, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a dark quote card PNG for a single quote + name.
 * 432×768px, #0d0d0d background, serif italic white quote, gray attribution.
 */
export async function generateQuoteCardPng(quote: string, victimName: string): Promise<Buffer> {
  const lines = wrapText(quote, 22);
  const lineHeight = 52;
  const totalTextHeight = lines.length * lineHeight;
  const quoteStartY = Math.floor((CARD_HEIGHT - totalTextHeight) / 2) - 20;

  const tspans = buildTspans(lines, CARD_WIDTH / 2, quoteStartY, lineHeight);
  const attributionY = quoteStartY + totalTextHeight + 48;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
  <defs>
    <style>
      .quote { font-family: Georgia, 'Times New Roman', serif; font-size: 40px; font-style: italic; fill: #FFFFFF; }
      .attribution { font-family: Georgia, 'Times New Roman', serif; font-size: 22px; fill: #888888; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#0d0d0d"/>

  <!-- Top accent line -->
  <rect x="40" y="60" width="${CARD_WIDTH - 80}" height="1" fill="#FFFFFF" opacity="0.15"/>

  <!-- Bottom accent line -->
  <rect x="40" y="${CARD_HEIGHT - 60}" width="${CARD_WIDTH - 80}" height="1" fill="#FFFFFF" opacity="0.15"/>

  <!-- Quote text -->
  <text class="quote" text-anchor="middle" dominant-baseline="auto" x="${CARD_WIDTH / 2}" y="${quoteStartY}">
    ${tspans}
  </text>

  <!-- Attribution -->
  <text class="attribution" text-anchor="middle" x="${CARD_WIDTH / 2}" y="${attributionY}">— ${escapeXml(victimName)}, allegedly</text>
</svg>`.trim();

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generate the cover title card PNG.
 * 432×768px, black background, yellow accent bars, title text.
 */
export async function generateCoverTitleCardPng(victimName: string): Promise<Buffer> {
  const titleLines = wrapText(`Things ${victimName} Would Never Say`, 18);
  const lineHeight = 62;
  const totalTitleHeight = titleLines.length * lineHeight;
  const titleStartY = Math.floor((CARD_HEIGHT - totalTitleHeight) / 2);

  const tspans = buildTspans(titleLines, CARD_WIDTH / 2, titleStartY, lineHeight);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
  <defs>
    <style>
      .subtitle { font-family: Georgia, 'Times New Roman', serif; font-size: 18px; letter-spacing: 4px; fill: #FACC15; }
      .title { font-family: Georgia, 'Times New Roman', serif; font-size: 52px; font-weight: bold; fill: #FFFFFF; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#000000"/>

  <!-- Top yellow bar -->
  <rect x="0" y="0" width="${CARD_WIDTH}" height="8" fill="#FACC15"/>

  <!-- Bottom yellow bar -->
  <rect x="0" y="${CARD_HEIGHT - 8}" width="${CARD_WIDTH}" height="8" fill="#FACC15"/>

  <!-- Subtitle -->
  <text class="subtitle" text-anchor="middle" x="${CARD_WIDTH / 2}" y="${titleStartY - 50}">A ROAST BOOK</text>

  <!-- Title -->
  <text class="title" text-anchor="middle" dominant-baseline="auto" x="${CARD_WIDTH / 2}" y="${titleStartY}">
    ${tspans}
  </text>
</svg>`.trim();

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Upload a PNG Buffer to Supabase Storage and return the public URL.
 */
export async function uploadPngToStorage(
  buffer: Buffer,
  slug: string,
  filename: string
): Promise<string> {
  const path = `generated/${slug}/${filename}`;

  const { error } = await supabaseAdmin.storage
    .from('roast-books')
    .upload(path, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload ${filename}: ${error.message}`);

  const { data } = supabaseAdmin.storage.from('roast-books').getPublicUrl(path);
  return data.publicUrl;
}
