import React from 'react';
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import path from 'path';
import { supabaseAdmin } from './supabase';

const CARD_W = 432;
const CARD_H = 768;

// Cache font buffers across calls — loaded once per Lambda warm instance
let _fonts: { name: string; data: ArrayBuffer; weight: number; style: 'normal' | 'italic' }[] | null = null;

function getFonts() {
  if (_fonts) return _fonts;
  const dir = path.join(process.cwd(), 'node_modules/@fontsource/lora/files');
  const load = (file: string): ArrayBuffer => {
    const buf = readFileSync(path.join(dir, file));
    // Convert Node Buffer → ArrayBuffer (safe for whole-file reads)
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  };
  _fonts = [
    { name: 'Lora', data: load('lora-latin-400-normal.woff2'), weight: 400, style: 'normal' },
    { name: 'Lora', data: load('lora-latin-400-italic.woff2'), weight: 400, style: 'italic' },
    { name: 'Lora', data: load('lora-latin-700-normal.woff2'), weight: 700, style: 'normal' },
  ];
  return _fonts;
}

async function renderToPng(el: React.ReactElement): Promise<Buffer> {
  // satori converts JSX → SVG with text as paths (no fontconfig needed)
  const svg = await satori(el, { width: CARD_W, height: CARD_H, fonts: getFonts() });
  // sharp converts path-only SVG → PNG (no text elements, so no fontconfig needed)
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Cover title card: black bg, yellow bars, "Things [Name] Would Never Say"
 */
export async function generateCoverTitleCardPng(victimName: string): Promise<Buffer> {
  return renderToPng(
    React.createElement(
      'div',
      { style: { width: '100%', height: '100%', backgroundColor: '#000000', display: 'flex', flexDirection: 'column' } },

      // Top yellow bar
      React.createElement('div', { style: { width: '100%', height: 8, backgroundColor: '#FACC15', flexShrink: 0 } }),

      // Center content
      React.createElement(
        'div',
        { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 48px' } },

        React.createElement('p', {
          style: { color: '#FACC15', fontSize: 13, letterSpacing: 4, fontFamily: 'Lora', margin: '0 0 28px 0', textAlign: 'center' },
        }, 'A ROAST BOOK'),

        React.createElement('p', {
          style: { color: '#ffffff', fontSize: 40, fontWeight: 700, fontFamily: 'Lora', textAlign: 'center', lineHeight: 1.3, margin: 0 },
        }, `Things ${victimName} Would Never Say`),
      ),

      // Bottom yellow bar
      React.createElement('div', { style: { width: '100%', height: 8, backgroundColor: '#FACC15', flexShrink: 0 } }),
    )
  );
}

/**
 * Quote card: dark bg, opening quote mark, italic quote, gray attribution.
 */
export async function generateQuoteCardPng(quote: string, victimName: string): Promise<Buffer> {
  return renderToPng(
    React.createElement(
      'div',
      { style: { width: '100%', height: '100%', backgroundColor: '#0d0d0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 48px' } },

      // Opening quote mark
      React.createElement('p', {
        style: { color: '#FACC15', fontSize: 80, lineHeight: 1, fontFamily: 'Lora', fontStyle: 'italic', margin: '0 0 8px 0', alignSelf: 'flex-start' },
      }, '\u201C'),

      // Quote text
      React.createElement('p', {
        style: { color: '#ffffff', fontSize: 34, fontStyle: 'italic', fontFamily: 'Lora', textAlign: 'center', lineHeight: 1.5, margin: '0 0 36px 0' },
      }, quote),

      // Attribution
      React.createElement('p', {
        style: { color: '#888888', fontSize: 18, fontFamily: 'Lora', textAlign: 'center', margin: 0 },
      }, `\u2014 ${victimName}, allegedly`),
    )
  );
}

/**
 * Upload a PNG Buffer to Supabase Storage and return the public URL.
 */
export async function uploadPngToStorage(buffer: Buffer, slug: string, filename: string): Promise<string> {
  const storagePath = `generated/${slug}/${filename}`;
  const { error } = await supabaseAdmin.storage
    .from('roast-books')
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });

  if (error) throw new Error(`Failed to upload ${filename}: ${error.message}`);

  const { data } = supabaseAdmin.storage.from('roast-books').getPublicUrl(storagePath);
  return data.publicUrl;
}
