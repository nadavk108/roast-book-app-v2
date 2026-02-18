import { supabaseAdmin } from './supabase';
import { generateTextOverlayPng, burnOverlayIntoImage } from './text-overlay';
import { generateHailuoClip, mergeVideoClips, addBackgroundMusic } from './fal-client';

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
 *
 * [Cover 6s]    — cover image + Hebrew title burned in, Ken Burns
 * [Scene 1 6s]  — image[0] + title + quote 1 burned in, Ken Burns
 * [Scene 2 6s]  — image[1] + title + quote 2 burned in, Ken Burns
 * ...
 * [Scene 8 6s]  — image[7] + title + quote 8 burned in, Ken Burns
 *
 * Total: 9 clips × 6s = 54s
 *
 * Text is burned into each source image locally via sharp (reliable, no external API).
 * Hailuo then animates each text-burned image with Ken Burns effect.
 *
 * Phase 1 (parallel): Generate 9 transparent text overlay PNGs (satori + Heebo Hebrew font)
 * Phase 2 (parallel): Download source images, composite overlays, upload text-burned images
 * Phase 3 (parallel): Hailuo animates each text-burned image (Ken Burns, 6s each)
 * Phase 4: Merge 9 clips in order
 * Phase 5: Overlay background music (non-fatal)
 * Phase 6: Download from Fal CDN → upload to Supabase Storage
 */
export async function generateRoastVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  const { bookId, slug, victimName, quotes, coverImageUrl, fullImageUrls } = input;
  const ctx = `[${bookId}]`;
  const startMs = Date.now();

  const allSourceUrls = [coverImageUrl, ...fullImageUrls]; // 9 images total
  const allQuotes = [undefined, ...quotes] as (string | undefined)[]; // cover has no quote

  console.log(`${ctx} ========== VIDEO GENERATION START ==========`);
  console.log(`${ctx} Book: "${victimName}", ${quotes.length} quotes, ${fullImageUrls.length} images`);

  // ── Phase 1: Generate text overlay PNGs (satori, Hebrew RTL) ─────────────────
  console.log(`${ctx} Phase 1: Generating ${allSourceUrls.length} text overlay PNGs...`);

  const overlayBuffers = await Promise.all(
    allQuotes.map(q => generateTextOverlayPng(victimName, q))
  );

  console.log(`${ctx} ✅ Phase 1 complete`);

  // ── Phase 2: Burn text overlays into source images (sharp, locally) ───────────
  // Downloads each source image, composites the overlay, uploads to Supabase.
  // Hailuo needs a public URL — burning locally avoids any FFmpeg overlay API.
  console.log(`${ctx} Phase 2: Burning text into ${allSourceUrls.length} source images...`);

  const burnedImageUrls = await Promise.all(
    allSourceUrls.map((sourceUrl, i) =>
      burnOverlayIntoImage(
        sourceUrl,
        overlayBuffers[i],
        slug,
        i === 0 ? 'burned_cover.jpg' : `burned_scene_${i}.jpg`,
      )
    )
  );

  console.log(`${ctx} ✅ Phase 2 complete: ${burnedImageUrls.length} text-burned images uploaded`);

  // ── Phase 3: Hailuo animates each text-burned image (Ken Burns, no morphing) ──
  // Ken Burns keeps text sharp throughout. No end_image_url — morphing between
  // images with different text would look bad.
  console.log(`${ctx} Phase 3: Generating ${burnedImageUrls.length} Hailuo animated clips...`);

  const clipUrls = await Promise.all(
    burnedImageUrls.map((url, i) =>
      generateHailuoClip(url, `${ctx}[hailuo-${i}]`)
      // No end_image_url — Ken Burns keeps text legible throughout
    )
  );

  console.log(`${ctx} ✅ Phase 3 complete: ${clipUrls.length} animated clips ready`);

  // ── Phase 4: Merge all clips ──────────────────────────────────────────────────
  console.log(`${ctx} Phase 4: Merging ${clipUrls.length} clips...`);
  let finalVideoUrl = await mergeVideoClips(clipUrls, `${ctx}[merge]`);
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
  const durationSeconds = clipUrls.length * 6; // 9 × 6 = 54s

  console.log(`${ctx} ========== VIDEO COMPLETE in ${Math.round(generationTimeMs / 1000)}s ==========`);

  return { videoUrl: storedVideoUrl, durationSeconds, generationTimeMs, clipUrls };
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
