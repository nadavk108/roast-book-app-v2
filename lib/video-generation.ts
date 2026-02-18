import { supabaseAdmin } from './supabase';
import { generateHailuoClip, mergeVideoClips, addBackgroundMusic } from './fal-client';

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
 * Phase 1 (parallel): Generate 9 Hailuo animated clips (cover + 8 images)
 * Phase 2: Merge 9 clips in order
 * Phase 3: Overlay background music (non-fatal)
 * Phase 4: Download from Fal CDN, upload to Supabase Storage
 *
 * Duration: 9 clips × 6s = 54s
 */
export async function generateRoastVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  const { bookId, slug, victimName, quotes, coverImageUrl, fullImageUrls } = input;
  const ctx = `[${bookId}]`;
  const startMs = Date.now();

  console.log(`${ctx} ========== VIDEO GENERATION START ==========`);
  console.log(`${ctx} Book: "${victimName}", ${fullImageUrls.length} images`);

  // ── Phase 1: Animated Hailuo clips (cover + 8 images, in parallel) ──────────
  console.log(`${ctx} Phase 1: Generating ${1 + fullImageUrls.length} Hailuo animated clips...`);

  const [coverHailuoUrl, ...imageClipUrls] = await Promise.all([
    generateHailuoClip(coverImageUrl, `${ctx}[cover-hailuo]`),
    ...fullImageUrls.map((url, i) =>
      generateHailuoClip(url, `${ctx}[hailuo-${i + 1}]`)
    ),
  ]);

  const allClipUrls = [coverHailuoUrl, ...imageClipUrls];
  console.log(`${ctx} ✅ Phase 1 complete: ${allClipUrls.length} animated clips ready`);

  // ── Phase 2: Merge all clips ─────────────────────────────────────────────────
  console.log(`${ctx} Phase 2: Merging ${allClipUrls.length} clips...`);
  let finalVideoUrl = await mergeVideoClips(allClipUrls, `${ctx}[merge]`);
  console.log(`${ctx} ✅ Phase 2 complete: merged video ready`);

  // ── Phase 3: Background music overlay (non-fatal) ────────────────────────────
  const musicUrl = (process.env.VIDEO_BACKGROUND_MUSIC_URL || '').trim();
  if (musicUrl) {
    console.log(`${ctx} Phase 3: Overlaying background music...`);
    try {
      finalVideoUrl = await addBackgroundMusic(finalVideoUrl, musicUrl, `${ctx}[music]`);
      console.log(`${ctx} ✅ Phase 3 complete: music overlaid`);
    } catch (err: any) {
      console.warn(`${ctx} ⚠️ Phase 3 SKIPPED (non-fatal): ${err.message}`);
    }
  } else {
    console.log(`${ctx} Phase 3: Skipped (VIDEO_BACKGROUND_MUSIC_URL not set)`);
  }

  // ── Phase 4: Download from Fal CDN → upload to Supabase Storage ──────────────
  console.log(`${ctx} Phase 4: Uploading final video to Supabase...`);

  const storedVideoUrl = await downloadAndUploadVideo(finalVideoUrl, slug, ctx);

  const generationTimeMs = Date.now() - startMs;
  const durationSeconds = allClipUrls.length * 6; // 9 clips × 6s = 54s

  console.log(`${ctx} ========== VIDEO COMPLETE in ${Math.round(generationTimeMs / 1000)}s ==========`);
  console.log(`${ctx} Video URL: ${storedVideoUrl}`);

  return {
    videoUrl: storedVideoUrl,
    durationSeconds,
    generationTimeMs,
    clipUrls: allClipUrls,
  };
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

  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to download video from Fal: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`${ctx} Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)}MB video`);

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
