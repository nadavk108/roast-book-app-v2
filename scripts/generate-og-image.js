#!/usr/bin/env node
// Generates /public/og-image.png — run with: node scripts/generate-og-image.js
// Placeholder OG image for the landing page. Replace with a proper design later.

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200;
const H = 630;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background: warm cream
ctx.fillStyle = '#FFF9E6';
ctx.fillRect(0, 0, W, H);

// Subtle border stripe at top (brand accent)
ctx.fillStyle = '#FF6B35';
ctx.fillRect(0, 0, W, 8);

// Flame emoji — centered top area
ctx.font = '96px serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('🔥', W / 2, 180);

// Headline
ctx.fillStyle = '#111111';
ctx.font = 'bold 62px sans-serif';
ctx.textBaseline = 'alphabetic';
ctx.fillText("The Funniest Gift They'll Never See Coming", W / 2, 340);

// Subtext
ctx.fillStyle = '#666666';
ctx.font = '32px sans-serif';
ctx.fillText('AI-generated roast books for your friends', W / 2, 410);

// Brand name bottom-right
ctx.fillStyle = '#FF6B35';
ctx.font = 'bold 28px sans-serif';
ctx.textAlign = 'right';
ctx.fillText('theroastbook.com', W - 48, H - 40);

// Write to /public
const outPath = path.join(__dirname, '..', 'public', 'og-image.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buffer);
console.log(`Written: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
