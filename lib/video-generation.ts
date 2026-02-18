import { supabaseAdmin } from './supabase';
import { generateTextOverlayPng } from './text-overlay';
import { 
  generateHailuoClip, 
  mergeVideoClips, 
  addBackgroundMusic,
  uploadPngToSupabase
} from './fal-client';
import { fal } from '@fal-ai/client';

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
 * NEW PIPELINE (text overlays AFTER video generation):
 * 
 * Shot 0: Cover image (static 3s) → animate to fullImages[0]
 * Shot 1: fullImages[0] → fullImages[1] (6s each)
 * Shot 2: fullImages[1] → fullImages[2]
 * ...
 * Shot 8: fullImages[7] → Ken Burns
 * 
 * Then overlay Hebrew text on top of merged video using transparent PNGs.
 */
export async function generateRoastVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  const { bookId, slug, victimName, quotes, coverImageUrl, fullImageUrls } = input;
  const ctx = `[${bookId}]`;
  const startMs = Date.now();

  console.log(`${ctx} ========== VIDEO GENERATION START ==========`);
  console.log(`${ctx} Book: "${victimName}", ${quotes.length} quotes, ${fullImageUrls.length} images`);

  // ── Phase 1: Generate clean Hailuo clips (NO text burned in) ─────────────────
  console.log(`${ctx} Phase 1: Generating Hailuo clips from clean images...`);
  
  const clipPromises: Promise<string>[] = [];

  // Clip 0: Cover (static 3s) → fullImages[0]
  clipPromises.push(
    generateHailuoClip(coverImageUrl, `${ctx}[clip-0-cover]`, fullImageUrls[0])
  );

  // Clips 1-7: fullImages[i] → fullImages[i+1]
  for (let i = 0; i < fullImageUrls.length - 1; i++) {
    clipPromises.push(
      generateHailuoClip(fullImageUrls[i], `${ctx}[clip-${i + 1}]`, fullImageUrls[i + 1])
    );
  }

  // Clip 8: fullImages[7] → Ken Burns (no end frame)
  clipPromises.push(
    generateHailuoClip(
      fullImageUrls[fullImageUrls.length - 1], 
      `${ctx}[clip-${fullImageUrls.length}]`,
      undefined
    )
  );

  const clipUrls = await Promise.all(clipPromises);
  console.log(`${ctx} ✅ Phase 1 complete: ${clipUrls.length} clean clips ready`);

  // ── Phase 2: Merge all clips ──────────────────────────────────────────────────
  console.log(`${ctx} Phase 2: Merging ${clipUrls.length} clips...`);
  let mergedVideoUrl = await mergeVideoClips(clipUrls, `${ctx}[merge]`);
  console.log(`${ctx} ✅ Phase 2 complete`);

  // ── Phase 3: Generate text overlays and upload to Supabase ───────────────────
  console.log(`${ctx} Phase 3: Generating Hebrew text overlays...`);

  // Generate all overlay PNGs (cover has title only, scenes have title + quote)
  const allQuotes: (string | undefined)[] = [undefined, ...quotes];
  const overlayBuffers = await Promise.all(
    allQuotes.map(q => generateTextOverlayPng(victimName, q))
  );

  // Upload overlay PNGs to Supabase to get public URLs
  const overlayUrls = await Promise.all(
    overlayBuffers.map((buffer, i) =>
      uploadPngToSupabase(buffer, slug, `overlay_${i}.png`, `${ctx}[overlay-${i}]`)
    )
  );

  console.log(`${ctx} ✅ Phase 3 complete: ${overlayUrls.length} text overlays uploaded`);

  // ── Phase 4: Composite ALL text overlays onto video in ONE operation ──────────
console.log(`${ctx} Phase 4: Compositing ${overlayUrls.length} text overlays onto video...`);

const COVER_DURATION_MS = 3000;
const CLIP_DURATION_MS = 6000;

// Build FFmpeg compose tracks: base video + all overlay images with timestamps
const tracks = [
  {
    id: 'base',
    type: 'video' as const,
    url: mergedVideoUrl,
  },
];

// Add each text overlay as a separate image track with timing
for (let i = 0; i < overlayUrls.length; i++) {
  const startTimeMs = i === 0 ? 0 : COVER_DURATION_MS + (i - 1) * CLIP_DURATION_MS;
  const durationMs = i === 0 ? COVER_DURATION_MS : CLIP_DURATION_MS;
  
  tracks.push({
    id: `overlay-${i}`,
    type: 'image' as const,
    url: overlayUrls[i],
    keyframes: [
      { timestamp: startTimeMs, duration: durationMs },
    ],
  });
}

// Single FFmpeg call to composite all overlays
const result = await fal.subscribe('fal-ai/ffmpeg-api/compose', {
  input: { tracks },
  logs: false,
});

function extractUrl(fileOrUrl: unknown): string {
  if (typeof fileOrUrl === 'string') return fileOrUrl;
  if (fileOrUrl && typeof fileOrUrl === 'object' && 'url' in fileOrUrl) {
    return (fileOrUrl as { url: string }).url;
  }
  throw new Error(`Cannot extract URL from: ${JSON.stringify(fileOrUrl)}`);
}

const currentVideoUrl = extractUrl(result.data.video_url ?? result.data.video);

console.log(`${ctx} ✅ Phase 4 complete: All text overlays composited`);

  // ── Phase 5: Background music (non-fatal) ────────────────────────────────────
  let finalVideoUrl = currentVideoUrl;
  const musicUrl = (process.env.VIDEO_BACKGROUND_MUSIC_URL || '').trim();
  if (musicUrl) {
    console.log(`${ctx} Phase 5: Overlaying background music...`);
    try {
      finalVideoUrl = await addBackgroundMusic(currentVideoUrl, musicUrl, `${ctx}[music]`);
      console.log(`${ctx} ✅ Phase 5 complete`);
    } catch (err: any) {
      console.warn(`${ctx} ⚠️ Phase 5 SKIPPED (non-fatal): ${err.message}`);
    }
  } else {
    console.log(`${ctx} Phase 5: Skipped (VIDEO_BACKGROUND_MUSIC_URL not set)`);
  }

  // ── Phase 6: Upload to Supabase Storage ──────────────────────────────────────
  console.log(`${ctx} Phase 6: Uploading final video to Supabase...`);
  const storedVideoUrl = await downloadAndUploadVideo(finalVideoUrl, slug, ctx);

  const generationTimeMs = Date.now() - startMs;
  const durationSeconds = COVER_DURATION_MS / 1000 + (clipUrls.length - 1) * (CLIP_DURATION_MS / 1000);

  console.log(`${ctx} ========== VIDEO COMPLETE in ${Math.round(generationTimeMs / 1000)}s ==========`);

  return { videoUrl: storedVideoUrl, durationSeconds, generationTimeMs, clipUrls };
}

async function downloadAndUploadVideo(videoUrl: string, slug: string, ctx: string): Promise<string> {
  const storagePath = `generated/${slug}/video_final.mp4`;

  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Failed to download video from Fal: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  const sizeMb = buffer.length / 1024 / 1024;
  console.log(`${ctx} Downloaded ${sizeMb.toFixed(1)}MB video`);

  const { error } = await supabaseAdmin.storage
    .from('roast-books')
    .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true });

  if (error) {
    if (error.message?.toLowerCase().includes('exceeded') || error.message?.toLowerCase().includes('size')) {
      console.warn(`${ctx} ⚠️ ${sizeMb.toFixed(1)}MB exceeds Supabase limit — storing Fal CDN URL directly`);
      return videoUrl;
    }
    throw new Error(`Failed to upload video to Supabase: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from('roast-books').getPublicUrl(storagePath);
  return data.publicUrl;
}