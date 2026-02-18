import { inngest } from '../client';
import { supabaseAdmin } from '../../supabase';
import { generateRoastVideo } from '../../video-generation';

export const generateVideoFunction = inngest.createFunction(
  {
    id: 'generate-video',
    name: 'Generate Roast Video',
    retries: 0, // Video generation is expensive — don't auto-retry
  },
  { event: 'video/generation.requested' },
  async ({ event, step }) => {
    const { bookId, slug, victimName, quotes, coverImageUrl, fullImageUrls } = event.data;
    const ctx = `[${bookId}]`;

    // Step 1: Mark as processing
    await step.run('mark-processing', async () => {
      await supabaseAdmin
        .from('roast_books')
        .update({ video_status: 'processing', video_error: null })
        .eq('id', bookId);
      console.log(`${ctx} Marked video_status=processing`);
    });

    // Step 2: Generate the video (long-running — may take 10–20 min)
    let result: Awaited<ReturnType<typeof generateRoastVideo>>;
    try {
      result = await step.run('generate-video', async () => {
        return generateRoastVideo({ bookId, slug, victimName, quotes, coverImageUrl, fullImageUrls });
      });
    } catch (err: any) {
      // Step 2a: Persist failure to DB
      await step.run('mark-failed', async () => {
        await supabaseAdmin
          .from('roast_books')
          .update({
            video_status: 'failed',
            video_error: err.message || 'Unknown error',
          })
          .eq('id', bookId);
        console.error(`${ctx} Video generation failed: ${err.message}`);
      });
      throw err;
    }

    // Step 3: Persist result
    await step.run('mark-complete', async () => {
      await supabaseAdmin
        .from('roast_books')
        .update({
          video_status: 'complete',
          video_url: result.videoUrl,
          video_generated_at: new Date().toISOString(),
          video_clip_urls: result.clipUrls,
          video_error: null,
        })
        .eq('id', bookId);
    });

    // Step 4: Log completion (email notifications to be added later)
    await step.run('log-completion', async () => {
      console.log(`${ctx} ✅ Video ready in ${Math.round(result.generationTimeMs / 1000)}s`);
      console.log(`${ctx} URL: ${result.videoUrl}`);
    });

    return {
      videoUrl: result.videoUrl,
      durationSeconds: result.durationSeconds,
    };
  },
);
