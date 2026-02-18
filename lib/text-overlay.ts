import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import path from 'path';

// Matches Hailuo-02 768P portrait output
const FRAME_W = 432;
const FRAME_H = 768;

// Cache font buffers per Lambda instance
let _fontBuffers: Buffer[] | null = null;

function getFontBuffers(): Buffer[] {
  if (_fontBuffers) return _fontBuffers;
  const dir = path.join(process.cwd(), 'public', 'fonts');
  _fontBuffers = [
    readFileSync(path.join(dir, 'heebo-hebrew-700-normal.woff')),
    readFileSync(path.join(dir, 'heebo-hebrew-400-normal.woff')),
    readFileSync(path.join(dir, 'heebo-latin-700-normal.woff')),
    readFileSync(path.join(dir, 'heebo-latin-400-normal.woff')),
  ];
  return _fontBuffers;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
 * Generate a TRANSPARENT PNG overlay (432×768) with:
 *  - Top bar: semi-transparent dark, Hebrew title RTL (yellow)
 *  - Bottom box: semi-transparent dark rounded, Hebrew quote RTL (white) — if provided
 *
 * Uses @resvg/resvg-js (HarfBuzz + FriBidi) for correct Hebrew RTL shaping.
 * This PNG will be composited on TOP of the video.
 */
export async function generateTextOverlayPng(
  victimName: string,
  quote?: string,
): Promise<Buffer> {
  const titleText = `דברים ש${victimName} לא יגיד לעולם`;

  const TOP_BAR_H = 68;
  const QUOTE_FONT_SIZE = 22;
  const QUOTE_LINE_H = 32;
  const BOX_PAD = 18;
  const BOTTOM_PAD = 40;
  const CX = FRAME_W / 2;

  let quoteSection = '';
  if (quote) {
    const lines = wrapText(`"${quote}"`, 20);
    const totalTextH = lines.length * QUOTE_LINE_H;
    const boxH = totalTextH + BOX_PAD * 2;
    const boxY = FRAME_H - boxH - BOTTOM_PAD;
    const firstLineY = boxY + BOX_PAD + QUOTE_FONT_SIZE;

    const tspans = lines
      .map((line, i) =>
        `<tspan x="${CX}" ${i === 0 ? `y="${firstLineY}"` : `dy="${QUOTE_LINE_H}"`}>${escapeXml(line)}</tspan>`
      )
      .join('');

    quoteSection = `
  <rect x="14" y="${boxY}" width="${FRAME_W - 28}" height="${boxH}" rx="14"
        fill="black" fill-opacity="0.82"/>
  <text font-family="Heebo" font-size="${QUOTE_FONT_SIZE}" fill="white"
        text-anchor="middle" direction="rtl" unicode-bidi="embed">
    ${tspans}
  </text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_W}" height="${FRAME_H}">
  <rect x="0" y="0" width="${FRAME_W}" height="${TOP_BAR_H}" fill="black" fill-opacity="0.75"/>
  <text x="${CX}" y="${TOP_BAR_H / 2 + 8}"
        font-family="Heebo" font-size="20" font-weight="700" fill="#FACC15"
        text-anchor="middle" direction="rtl" unicode-bidi="embed">${escapeXml(titleText)}</text>
  ${quoteSection}
</svg>`;

  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: getFontBuffers(),
      defaultFontFamily: 'Heebo',
    },
  });

  return Buffer.from(resvg.render().asPng());
}