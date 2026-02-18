import { supabaseAdmin } from './supabase';
import { generateCoverTitleCardPng, generateQuoteCardPng, uploadPngToStorage } from './quote-card';
import { generateHailuoClip, createStaticClip, mergeVideoClips, addBackgroundMusic } from './fal-client';

export type VideoGenerationInput = {
  bookId: string;
  slug: string;
  victimName: string;
  quotes: string[];
  coverImageUrl: string;
  fullImageUrls: string[];
};

export type VideoGenerationResult = {
  videoUrl: string;
  durationSeconds: number;
  generationTimeMs: number;
  clipUrls: string[];
};

/**
 * Full video pipeline. Structure:
 *   [Cover title card 3s] → [Cover image 6s] → [Quote 1 3s] → [Image 1 6s] → ... × 8
 *   Total: 3+6 + 8×(3+6) = 81s, 18 clips
 *
 * Phase 1 (parallel): Generate 9 PNG cards → upload to Supabase
 * Phase 2 (parallel): Generate 9 Hailuo animated clips
 * Phase 3 (parallel): Convert 9 PNG cards → 3s static clips
 * Phase 4: Merge 18 clips in order
 * Phase 5: Overlay background music (non-fatal)
 * Phase 6: Download from Fal CDN → upload to Supabase Storage
 */
export async function generateRoastVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  const { bookId, slug, victimName, quotes, coverImageUrl, fullImageUrls } = input;
  const ctx = `[${bookId}]`;
  const startMs = Date.now();

  console.log(`${ctx} ========== VIDEO GENERATION START ==========`);
  console.log(`${ctx} Book: "${victimName}", ${quotes.length} quotes, ${fullImageUrls.length} images`);

  // ── Phase 1: Generate PNG cards and upload ───────────────────────────────────
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

  // ── Phase 2: Hailuo animated clips (cover + 8 images, in parallel) ───────────
  // Cover:       Ken Burns (no end frame — pure cover showcase)
  // Image[0..6]: start→end frame transitions (image[i] morphs into image[i+1])
  // Image[7]:    Ken Burns (last image, no next frame to transition to)
  console.log(`${ctx} Phase 2: Generating ${1 + fullImageUrls.length} Hailuo animated clips...`);

  const [coverHailuoUrl, ...imageClipUrls] = await Promise.all([
    generateHailuoClip(coverImageUrl, `${ctx}[cover-hailuo]`),
    ...fullImageUrls.map((url, i) =>
      generateHailuoClip(
        url,
        `${ctx}[hailuo-${i + 1}]`,
        i < fullImageUrls.length - 1 ? fullImageUrls[i + 1] : undefined, // end frame = next image
      )
    ),
  ]);

  console.log(`${ctx} ✅ Phase 2 complete: ${1 + fullImageUrls.length} animated clips ready`);

  // ── Phase 3: Convert PNG cards → 3s static clips ─────────────────────────────
  console.log(`${ctx} Phase 3: Converting ${1 + quoteCardUrls.length} cards to 3s static clips...`);

  const [coverTitleClipUrl, ...quoteClipUrls] = await Promise.all([
    createStaticClip(coverTitleCardUrl, 3000, `${ctx}[cover-title-clip]`),
    ...quoteCardUrls.map((url, i) => createStaticClip(url, 3000, `${ctx}[quote-clip-${i + 1}]`)),
  ]);

  console.log(`${ctx} ✅ Phase 3 complete: ${1 + quoteCardUrls.length} static clips ready`);

  // ── Phase 4: Assemble 18 clips in order and merge ────────────────────────────
  // [cover_title(3s), cover_hailuo(6s), quote1(3s), image1(6s), ... × 8]
  const orderedClips: string[] = [
    coverTitleClipUrl,
    coverHailuoUrl,
    ...interleave(quoteClipUrls, imageClipUrls),
  ];

  console.log(`${ctx} Phase 4: Merging ${orderedClips.length} clips...`);
  let finalVideoUrl = await mergeVideoClips(orderedClips, `${ctx}[merge]`);
  console.log(`${ctx} ✅ Phase 4 complete`);

  // ── Phase 5: Background music (non-fatal) ────────────────────────────────────
  const musicUrl = (process.env.VIDEO_BACKGROUND_MUSIC_URL || '').trim();
  if (musicUrl) {
    console.log(`${ctx} Phase 5: Overlaying background music...`);
    try {
      finalVideoUrl = await addBackgroundMusic(finalVideoUrl, musicUrl, `${ctx}[music]`);
      console.log(`${ctx} ✅ Phase 5 complete`);
    } catch (err: any) {
      console.warn(`${ctx} ⚠️ Phase 5 SKIPPED (non-fatal): ${err.message}`);
    }
  } else {
    console.log(`${ctx} Phase 5: Skipped (VIDEO_BACKGROUND_MUSIC_URL not set)`);
  }

  // ── Phase 6: Download from Fal CDN → upload to Supabase Storage ──────────────
  console.log(`${ctx} Phase 6: Uploading final video to Supabase...`);
  const storedVideoUrl = await downloadAndUploadVideo(finalVideoUrl, slug, ctx);

  const generationTimeMs = Date.now() - startMs;
  const durationSeconds = 3 + 6 + quotes.length * (3 + 6); // 81s

  console.log(`${ctx} ========== VIDEO COMPLETE in ${Math.round(generationTimeMs / 1000)}s ==========`);
  console.log(`${ctx} Video URL: ${storedVideoUrl}`);

  return { videoUrl: storedVideoUrl, durationSeconds, generationTimeMs, clipUrls: orderedClips };
}

function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) result.push(a[i], b[i]);
  return result;
}

async function downloadAndUploadVideo(videoUrl: string, slug: string, ctx: string): Promise<string> {
  const storagePath = `generated/${slug}/video_final.mp4`;

  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to download video from Fal: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  console.log(`${ctx} Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)}MB video`);

  const { error } = await supabaseAdmin.storage
    .from('roast-books')
    .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true });

  if (error) throw new Error(`Failed to upload video to Supabase: ${error.message}`);

  const { data } = supabaseAdmin.storage.from('roast-books').getPublicUrl(storagePath);
  return data.publicUrl;
}
