import { supabaseAdmin } from './supabase';
import { generateCoverTitleCardPng, generateQuoteCardPng, uploadPngToStorage } from './quote-card';
import { generateHailuoClip, createStaticClip, mergeVideoClips, addBackgroundMusic } from './fal-client';

export type VideoGenerationInput = {
  bookId: string;
  slug: string;
  victimName: string;
  quotes: string[];
  coverImageUrl: string;       // cover_image_url from DB
  fullImageUrls: string[];     // full_image_urls[0..7] from DB
};

export type VideoGenerationResult = {
  videoUrl: string;
  durationSeconds: number;
  generationTimeMs: number;
  clipUrls: string[];
};

/**
 * Full video generation pipeline for a completed roast book.
 *
 * Phase 1 (parallel): Generate all PNG cards, upload to Supabase
 * Phase 2 (parallel): Generate all 9 Hailuo animated clips
 * Phase 3 (parallel): Convert all 9 PNG cards to 3s static clips
 * Phase 4: Merge 18 clips in order
 * Phase 5: Overlay background music (non-fatal)
 * Phase 6: Download from Fal CDN, upload to Supabase Storage
 */
export async function generateRoastVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  const { bookId, slug, victimName, quotes, coverImageUrl, fullImageUrls } = input;
  const ctx = `[${bookId}]`;
  const startMs = Date.now();

  console.log(`${ctx} ========== VIDEO GENERATION START ==========`);
  console.log(`${ctx} Book: "${victimName}", ${quotes.length} quotes, ${fullImageUrls.length} images`);

  // ── Phase 1: Generate PNG cards and upload to Supabase ──────────────────────
  console.log(`${ctx} Phase 1: Generating PNG cards...`);

  const [coverTitlePng, ...quotePngs] = await Promise.all([
    generateCoverTitleCardPng(victimName),
    ...quotes.map(q => generateQuoteCardPng(q, victimName)),
  ]);

  const [coverTitleCardUrl, ...quoteCardUrls] = await Promise.all([
    uploadPngToStorage(coverTitlePng, slug, 'card_cover_title.png'),
    ...quotePngs.map((buf, i) => uploadPngToStorage(buf, slug, `card_quote_${i + 1}.png`)),
  ]);

  console.log(`${ctx} ✅ Phase 1 complete: ${1 + quotes.length} PNG cards uploaded`);

  // ── Phase 2: Animated Hailuo clips (cover + 8 images, in parallel) ──────────
  console.log(`${ctx} Phase 2: Generating ${1 + fullImageUrls.length} Hailuo animated clips...`);

  const [coverHailuoUrl, ...imageClipUrls] = await Promise.all([
    generateHailuoClip(coverImageUrl, `${ctx}[cover-hailuo]`),
    ...fullImageUrls.map((url, i) =>
      generateHailuoClip(url, `${ctx}[hailuo-${i + 1}]`)
    ),
  ]);

  console.log(`${ctx} ✅ Phase 2 complete: ${1 + fullImageUrls.length} animated clips ready`);

  // ── Phase 3: Static 3s clips from PNG cards ──────────────────────────────────
  console.log(`${ctx} Phase 3: Converting ${1 + quoteCardUrls.length} PNG cards to 3s static clips...`);

  const [coverTitleClipUrl, ...quoteClipUrls] = await Promise.all([
    createStaticClip(coverTitleCardUrl, 3000, `${ctx}[cover-title-clip]`),
    ...quoteCardUrls.map((url, i) =>
      createStaticClip(url, 3000, `${ctx}[quote-clip-${i + 1}]`)
    ),
  ]);

  console.log(`${ctx} ✅ Phase 3 complete: ${1 + quoteCardUrls.length} static clips ready`);

  // ── Phase 4: Assemble 18 clips in order and merge ────────────────────────────
  // Order: cover_title(3s) → cover_hailuo(6s) → [quote_N(3s) → image_N(6s)] × 8
  const orderedClips: string[] = [
    coverTitleClipUrl,
    coverHailuoUrl,
    ...interleave(quoteClipUrls, imageClipUrls),
  ];

  console.log(`${ctx} Phase 4: Merging ${orderedClips.length} clips...`);
  let finalVideoUrl = await mergeVideoClips(orderedClips, `${ctx}[merge]`);
  console.log(`${ctx} ✅ Phase 4 complete: merged video ready`);

  // ── Phase 5: Background music overlay (non-fatal) ────────────────────────────
  const musicUrl = (process.env.VIDEO_BACKGROUND_MUSIC_URL || '').trim();
  if (musicUrl) {
    console.log(`${ctx} Phase 5: Overlaying background music...`);
    try {
      finalVideoUrl = await addBackgroundMusic(finalVideoUrl, musicUrl, `${ctx}[music]`);
      console.log(`${ctx} ✅ Phase 5 complete: music overlaid`);
    } catch (err: any) {
      console.warn(`${ctx} ⚠️ Phase 5 SKIPPED (non-fatal): ${err.message}`);
      // Continue with silent video
    }
  } else {
    console.log(`${ctx} Phase 5: Skipped (VIDEO_BACKGROUND_MUSIC_URL not set)`);
  }

  // ── Phase 6: Download from Fal CDN → upload to Supabase Storage ──────────────
  console.log(`${ctx} Phase 6: Uploading final video to Supabase...`);

  const storedVideoUrl = await downloadAndUploadVideo(finalVideoUrl, slug, ctx);

  const generationTimeMs = Date.now() - startMs;
  // 3 + 6 + 8×(3+6) = 81 seconds
  const durationSeconds = 3 + 6 + quotes.length * (3 + 6);

  console.log(`${ctx} ========== VIDEO COMPLETE in ${Math.round(generationTimeMs / 1000)}s ==========`);
  console.log(`${ctx} Video URL: ${storedVideoUrl}`);

  return {
    videoUrl: storedVideoUrl,
    durationSeconds,
    generationTimeMs,
    clipUrls: orderedClips,
  };
}

/**
 * Interleave two arrays: [a1, b1, a2, b2, ...]
 */
function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    result.push(a[i], b[i]);
  }
  return result;
}

/**
 * Download a video from a URL and upload it to Supabase Storage.
 * Returns the public Supabase URL.
 */
async function downloadAndUploadVideo(
  videoUrl: string,
  slug: string,
  ctx: string
): Promise<string> {
  const path = `generated/${slug}/video_final.mp4`;

  // Download from Fal CDN
  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to download video from Fal: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`${ctx} Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)}MB video`);

  // Upload to Supabase Storage
  const { error } = await supabaseAdmin.storage
    .from('roast-books')
    .upload(path, buffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload video to Supabase: ${error.message}`);

  const { data } = supabaseAdmin.storage.from('roast-books').getPublicUrl(path);
  return data.publicUrl;
}
