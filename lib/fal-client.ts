import { fal } from '@fal-ai/client';
import { withRetryContext } from './retry';

// @fal-ai/client reads FAL_KEY from env automatically — no fal.config() needed.

const MOTION_PROMPT =
  'Cinematic motion: gentle slow Ken Burns zoom or pan. Subject preserved. Portrait orientation maintained.';

/**
 * Extract a URL from a fal File output (which may be a string or { url: string }).
 */
function extractUrl(fileOrUrl: unknown): string {
  if (typeof fileOrUrl === 'string') return fileOrUrl;
  if (fileOrUrl && typeof fileOrUrl === 'object' && 'url' in fileOrUrl) {
    return (fileOrUrl as { url: string }).url;
  }
  throw new Error(`Cannot extract URL from: ${JSON.stringify(fileOrUrl)}`);
}

/**
 * Generate an animated 6-second video clip from a static image using Hailuo-02.
 * When endImageUrl is provided, Hailuo animates FROM imageUrl TO endImageUrl,
 * creating a fluid transition between shots.
 * Returns the URL of the generated video on Fal's CDN.
 */
export async function generateHailuoClip(
  imageUrl: string,
  context: string,
  endImageUrl?: string
): Promise<string> {
  return withRetryContext(
    async () => {
      console.log(`${context} Calling Hailuo-02${endImageUrl ? ' (start→end)' : ' (Ken Burns)'}`);

      const result = await fal.subscribe('fal-ai/minimax/hailuo-02/standard/image-to-video', {
        input: {
          image_url: imageUrl,
          ...(endImageUrl ? { end_image_url: endImageUrl } : {}),
          duration: '6',
          resolution: '768P',
          prompt: MOTION_PROMPT,
          prompt_optimizer: true,
        },
        logs: false,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS' && update.logs?.length) {
            console.log(`${context} Hailuo: ${update.logs.at(-1)?.message}`);
          }
        },
      });

      const videoUrl = extractUrl(result.data.video);
      console.log(`${context} ✅ Hailuo clip ready`);
      return videoUrl;
    },
    {
      context,
      maxAttempts: 3,
      initialDelayMs: 5000,
    }
  );
}

/**
 * Merge multiple video clip URLs into a single video.
 * videoUrls must be in the final desired order.
 * Returns the URL of the merged video.
 */
export async function mergeVideoClips(
  videoUrls: string[],
  context: string
): Promise<string> {
  return withRetryContext(
    async () => {
      console.log(`${context} Merging ${videoUrls.length} clips`);

      const result = await fal.subscribe('fal-ai/ffmpeg-api/merge-videos', {
        input: {
          video_urls: videoUrls,
        },
        logs: false,
      });

      const videoUrl = extractUrl(result.data.video);
      console.log(`${context} ✅ Merged video ready`);
      return videoUrl;
    },
    {
      context,
      maxAttempts: 3,
      initialDelayMs: 5000,
    }
  );
}

/**
 * Overlay background music onto a video.
 * Returns the URL of the video with music.
 * NON-FATAL: caller should catch errors and continue with silent video.
 */
export async function addBackgroundMusic(
  videoUrl: string,
  audioUrl: string,
  context: string
): Promise<string> {
  return withRetryContext(
    async () => {
      console.log(`${context} Adding background music`);

      const result = await fal.subscribe('fal-ai/ffmpeg-api/merge-audio-video', {
        input: {
          video_url: videoUrl,
          audio_url: audioUrl,
        },
        logs: false,
      });

      const resultUrl = extractUrl(result.data.video);
      console.log(`${context} ✅ Music overlay ready`);
      return resultUrl;
    },
    {
      context,
      maxAttempts: 2,
      initialDelayMs: 3000,
    }
  );
}

/**
 * Upload a PNG buffer to Supabase and return public URL.
 * Used for text overlay PNGs that will be composited on video.
 */
export async function uploadPngToSupabase(
  buffer: Buffer,
  slug: string,
  filename: string,
  context: string,
): Promise<string> {
  const { supabaseAdmin } = await import('./supabase');
  
  const storagePath = `generated/${slug}/${filename}`;
  const { error } = await supabaseAdmin.storage
    .from('roast-books')
    .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });

  if (error) throw new Error(`${context} Failed to upload PNG: ${error.message}`);

  const { data } = supabaseAdmin.storage.from('roast-books').getPublicUrl(storagePath);
  console.log(`${context} ✅ PNG uploaded`);
  return data.publicUrl;
}

/**
 * Overlay a transparent PNG on top of a video at a specific timestamp.
 * Uses FFmpeg compose to layer the overlay image on top of base video.
 * startTimeMs: when the overlay should appear (milliseconds from video start)
 * durationMs: how long the overlay should stay visible
 */
export async function overlayTextOnVideo(
  videoUrl: string,
  overlayPngUrl: string,
  startTimeMs: number,
  durationMs: number,
  context: string,
): Promise<string> {
  return withRetryContext(
    async () => {
      console.log(`${context} Overlaying text at ${startTimeMs}ms for ${durationMs}ms`);
      
      const result = await fal.subscribe('fal-ai/ffmpeg-api/compose', {
        input: {
          tracks: [
            {
              id: 'base',
              type: 'video',
              url: videoUrl,
            },
            {
              id: 'overlay',
              type: 'image',
              url: overlayPngUrl,
              keyframes: [
                { timestamp: startTimeMs, duration: durationMs },
              ],
            },
          ],
        },
        logs: false,
      });

      const videoOut = extractUrl(result.data.video_url ?? result.data.video);
      console.log(`${context} ✅ Text overlay complete`);
      return videoOut;
    },
    {
      context,
      maxAttempts: 3,
      initialDelayMs: 3000,
    },
  );
}