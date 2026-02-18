import { fal } from '@fal-ai/client';
import { withRetryContext } from './retry';

// @fal-ai/client reads FAL_KEY from env automatically — no fal.config() needed.

const MOTION_PROMPT =
  'Gentle cinematic Ken Burns effect: slow pan or zoom, no text distortion, subject preserved, ' +
  'natural movement, portrait orientation maintained, photorealistic.';

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
 * Returns the URL of the generated video on Fal's CDN.
 */
export async function generateHailuoClip(
  imageUrl: string,
  context: string
): Promise<string> {
  return withRetryContext(
    async () => {
      console.log(`${context} Calling Hailuo-02 for: ...${imageUrl.slice(-40)}`);

      const result = await fal.subscribe('fal-ai/minimax/hailuo-02/standard/image-to-video', {
        input: {
          image_url: imageUrl,
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
 * Convert a static PNG image into a short video clip via Fal FFmpeg compose.
 * durationMs: clip duration in milliseconds (e.g. 3000 for 3 seconds).
 * Returns the URL of the generated video clip.
 */
export async function createStaticClip(
  imageUrl: string,
  durationMs: number,
  context: string
): Promise<string> {
  return withRetryContext(
    async () => {
      console.log(`${context} Creating static clip from: ...${imageUrl.slice(-40)}`);

      const result = await fal.subscribe('fal-ai/ffmpeg-api/compose', {
        input: {
          tracks: [
            {
              id: 'video',
              type: 'video',
              keyframes: [
                { timestamp: 0, duration: durationMs, url: imageUrl },
              ],
            },
          ],
        },
        logs: false,
      });

      const videoUrl = extractUrl(result.data.video_url);
      console.log(`${context} ✅ Static clip ready`);
      return videoUrl;
    },
    {
      context,
      maxAttempts: 3,
      initialDelayMs: 3000,
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
