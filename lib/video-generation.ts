import { supabaseAdmin } from './supabase';
import { generateTextOverlayPng, uploadOverlayToStorage } from './text-overlay';
import { generateHailuoClip, overlayTextOnVideo, mergeVideoClips, addBackgroundMusic } from './fal-client';

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
 * [Cover 6s]     — Ken Burns on cover image, Hebrew title only (no quote)
 * [Scene 1 6s]   — image[0]→image[1] transition, title + quote 1 overlaid
 * [Scene 2 6s]   — image[1]→image[2] transition, title + quote 2 overlaid
 * ...
 * [Scene 8 6s]   — image[7] Ken Burns, title + quote 8 overlaid
 *
 * Total: 9 clips × 6s = 54s
 * Text burns directly into each clip — no separate quote card clips.
 *
 * Phase 1 (parallel): Generate 9 transparent text overlay PNGs → upload to Supabase
 * Phase 2 (parallel): Generate 9 Hailuo animated clips
 * Phase 3 (parallel): Composite text overlay onto each Hailuo clip
 * Phase 4: Merge 9 composited clips in order
 * Phase 5: Overlay background music (non-fatal)
 * Phase 6: Download from Fal CDN → upload to Supabase Storage
 */
export async function generateRoastVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  const { bookId, slug, victimName, quotes, coverImageUrl, fullImageUrls } = input;
  const ctx = `[${bookId}]`;
  const startMs = Date.now();

  console.log(`${ctx} ========== VIDEO GENERATION START ==========`);
  console.log(`${ctx} Book: "${victimName}", ${quotes.length} quotes, ${fullImageUrls.length} images`);

  // ── Phase 1: Generate transparent text overlay PNGs ──────────────────────────
  console.log(`${ctx} Phase 1: Generating ${1 + fullImageUrls.length} text overlay PNGs...`);

  const overlayPngs = await Promise.all([
    generateTextOverlayPng(victimName),                              // cover: title only
    ...quotes.map(q => generateTextOverlayPng(victimName, q)),      // scenes: title + quote
  ]);

  const overlayUrls = await Promise.all(
    overlayPngs.map((buf, i) =>
      uploadOverlayToStorage(
        buf,
        slug,
        i === 0 ? 'overlay_cover.png' : `overlay_scene_${i}.png`,
      )
    )
  );

  console.log(`${ctx} ✅ Phase 1 complete: ${overlayUrls.length} overlays uploaded`);

  // ── Phase 2: Hailuo animated clips (cover + 8 images, in parallel) ───────────
  // Cover:       Ken Burns (no end frame — pure cover showcase)
  // Image[0..6]: start→end frame transitions (image[i] morphs into image[i+1])
  // Image[7]:    Ken Burns (last image, no next frame)
  console.log(`${ctx} Phase 2: Generating ${1 + fullImageUrls.length} Hailuo animated clips...`);

  const [coverHailuoUrl, ...imageClipUrls] = await Promise.all([
    generateHailuoClip(coverImageUrl, `${ctx}[cover-hailuo]`),
    ...fullImageUrls.map((url, i) =>
      generateHailuoClip(
        url,
        `${ctx}[hailuo-${i + 1}]`,
        i < fullImageUrls.length - 1 ? fullImageUrls[i + 1] : undefined,
      )
    ),
  ]);

  const rawClipUrls = [coverHailuoUrl, ...imageClipUrls];
  console.log(`${ctx} ✅ Phase 2 complete: ${rawClipUrls.length} animated clips ready`);

  // ── Phase 3: Composite text overlays onto each clip ──────────────────────────
  console.log(`${ctx} Phase 3: Compositing text overlays onto ${rawClipUrls.length} clips...`);

  const composited = await Promise.all(
    rawClipUrls.map((clipUrl, i) =>
      overlayTextOnVideo(clipUrl, overlayUrls[i], 6000, `${ctx}[overlay-${i}]`)
    )
  );

  console.log(`${ctx} ✅ Phase 3 complete: ${composited.length} clips with text ready`);

  // ── Phase 4: Merge all composited clips ──────────────────────────────────────
  console.log(`${ctx} Phase 4: Merging ${composited.length} clips...`);
  let finalVideoUrl = await mergeVideoClips(composited, `${ctx}[merge]`);
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
  const durationSeconds = rawClipUrls.length * 6; // 9 × 6 = 54s

  console.log(`${ctx} ========== VIDEO COMPLETE in ${Math.round(generationTimeMs / 1000)}s ==========`);

  return { videoUrl: storedVideoUrl, durationSeconds, generationTimeMs, clipUrls: composited };
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
