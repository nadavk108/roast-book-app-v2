import React from 'react';
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import path from 'path';
import { supabaseAdmin } from './supabase';

// Matches Hailuo-02 768P portrait output dimensions
const FRAME_W = 432;
const FRAME_H = 768;

// Cache fonts — loaded once per Lambda warm instance
let _fonts: { name: string; data: ArrayBuffer; weight: number; style: 'normal' | 'italic' }[] | null = null;

function getFonts() {
  if (_fonts) return _fonts;
  const dir = path.join(process.cwd(), 'public', 'fonts');
  const load = (file: string): ArrayBuffer => {
    const buf = readFileSync(path.join(dir, file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  };
  // Load both Hebrew and Latin subsets — Heebo supports mixed text (Hebrew + English names)
  _fonts = [
    { name: 'Heebo', data: load('heebo-hebrew-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Heebo', data: load('heebo-hebrew-700-normal.woff'), weight: 700, style: 'normal' },
    { name: 'Heebo', data: load('heebo-latin-400-normal.woff'),  weight: 400, style: 'normal' },
    { name: 'Heebo', data: load('heebo-latin-700-normal.woff'),  weight: 700, style: 'normal' },
  ];
  return _fonts;
}

/**
 * Generate a transparent PNG overlay for a video frame.
 *
 * - Top bar: semi-transparent dark bar, Hebrew title, RTL
 * - Bottom box (if quote provided): semi-transparent dark rounded box, Hebrew quote, RTL
 * - Everything else: fully transparent (video shows through)
 */
export async function generateTextOverlayPng(
  victimName: string,
  quote?: string,     // undefined for cover scene (title only)
): Promise<Buffer> {
  const titleText = `דברים ש${victimName} לא יגיד לעולם`;

  const el = React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        // No backgroundColor — stays transparent, video shows through
      },
    },

    // ── Top bar: Hebrew title ────────────────────────────────────────────────
    React.createElement(
      'div',
      {
        style: {
          width: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.72)',
          padding: '18px 16px 14px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      },
      React.createElement('p', {
        style: {
          color: '#FACC15',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'Heebo',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.3,
          direction: 'rtl',
        },
      }, titleText),
    ),

    // ── Bottom: quote box ────────────────────────────────────────────────────
    quote
      ? React.createElement(
          'div',
          {
            style: {
              width: '100%',
              padding: '0 14px 36px',
              display: 'flex',
              justifyContent: 'center',
            },
          },
          React.createElement(
            'div',
            {
              style: {
                backgroundColor: 'rgba(0, 0, 0, 0.80)',
                borderRadius: 14,
                padding: '18px 20px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              },
            },
            React.createElement('p', {
              style: {
                color: '#ffffff',
                fontSize: 24,
                fontWeight: 400,
                fontFamily: 'Heebo',
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.5,
                direction: 'rtl',
              },
            }, `"${quote}"`),
          ),
        )
      : React.createElement('div', { style: { height: 1 } }), // spacer — no quote on cover
  );

  // satori → SVG (text converted to paths, no fontconfig needed)
  // sharp → RGBA PNG (transparent where no elements are drawn)
  const svg = await satori(el, { width: FRAME_W, height: FRAME_H, fonts: getFonts() });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Download a source image, resize to 432×768, composite the text overlay on top,
 * upload the result to Supabase Storage, and return a public URL for Hailuo.
 *
 * This burns the text directly into the image — no external video compositing needed.
 * Hailuo then animates the text-burned image with Ken Burns effect.
 */
export async function burnOverlayIntoImage(
  sourceImageUrl: string,
  overlayBuffer: Buffer,
  slug: string,
  filename: string,
): Promise<string> {
  // Download source image
  const response = await fetch(sourceImageUrl);
  if (!response.ok) throw new Error(`Failed to download source image: ${response.status}`);
  const sourceBuffer = Buffer.from(await response.arrayBuffer());

  // Resize source to 432×768 (9:16), composite transparent overlay on top
  const burned = await sharp(sourceBuffer)
    .resize(FRAME_W, FRAME_H, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlayBuffer, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  // Upload to Supabase — Hailuo needs a public URL
  const storagePath = `generated/${slug}/${filename}`;
  const { error } = await supabaseAdmin.storage
    .from('roast-books')
    .upload(storagePath, burned, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Failed to upload burned image ${filename}: ${error.message}`);

  const { data } = supabaseAdmin.storage.from('roast-books').getPublicUrl(storagePath);
  return data.publicUrl;
}
