import { inngest } from '../client';
import { supabaseAdmin } from '../../supabase';
import { generateRoastVideo } from '../../video-generation';
import { sendUserVideoReadyEmail } from '../../email';

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

    // Step 4: Notify user via email
    const notification = await step.run('notify-user', async () => {
      console.log(`${ctx} ✅ Video ready in ${Math.round(result.generationTimeMs / 1000)}s`);

      // Fetch user_id from roast_books
      const { data: book, error: bookError } = await supabaseAdmin
        .from('roast_books')
        .select('user_id')
        .eq('id', bookId)
        .single();

      if (bookError || !book?.user_id) {
        const msg = bookError?.message || 'No user_id on book';
        console.warn(`${ctx} Could not fetch user_id: ${msg}`);
        return { notified: false, error: msg };
      }

      // Fetch email from auth.users
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(book.user_id);

      if (userError || !user?.email) {
        const msg = userError?.message || 'No email for user';
        console.warn(`${ctx} Could not fetch user email: ${msg}`);
        return { notified: false, error: msg };
      }

      // Send email — non-fatal on failure
      try {
        await sendUserVideoReadyEmail({ to: user.email, victimName, slug });
        console.log(`${ctx} Email sent to ${user.email}`);
        return { notified: true, email: user.email };
      } catch (err: any) {
        console.error(`${ctx} Email notification failed: ${err.message}`);
        return { notified: false, error: err.message };
      }
    });

    return {
      videoUrl: result.videoUrl,
      durationSeconds: result.durationSeconds,
      notification,
    };
  },
);
