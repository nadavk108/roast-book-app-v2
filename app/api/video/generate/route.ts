import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { isAdminUser } from '@/lib/admin';
import { generateRoastVideo } from '@/lib/video-generation';
import { sendVideoReadyEmail } from '@/lib/email';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Auth: admin only
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let bookId: string;
  try {
    ({ bookId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!bookId) {
    return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
  }

  console.log(`[VIDEO] Admin triggered video generation for book ${bookId}`);

  // Fetch book
  const { data: book, error: fetchError } = await supabaseAdmin
    .from('roast_books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (fetchError || !book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // Guard: book must be complete with 8 images
  if (book.status !== 'complete') {
    return NextResponse.json({ error: 'Book is not complete' }, { status: 400 });
  }
  if (!book.full_image_urls || book.full_image_urls.length < 8) {
    return NextResponse.json({ error: 'Book does not have 8 images yet' }, { status: 400 });
  }
  if (!book.cover_image_url) {
    return NextResponse.json({ error: 'Book has no cover image' }, { status: 400 });
  }

  // Shortcut: already complete
  if (book.video_status === 'complete' && book.video_url) {
    console.log(`[VIDEO] Book ${bookId} already has a video, returning existing URL`);
    return NextResponse.json({
      videoUrl: book.video_url,
      alreadyComplete: true,
    });
  }

  // Atomic lock: only proceed if video_status is null or 'failed'
  const { data: lockResult } = await supabaseAdmin
    .from('roast_books')
    .update({ video_status: 'processing', video_error: null })
    .eq('id', bookId)
    .or('video_status.is.null,video_status.eq.failed')
    .select('id')
    .maybeSingle();

  if (!lockResult) {
    console.log(`[VIDEO] Lock failed for ${bookId} — already processing`);
    return NextResponse.json({ error: 'Video generation already in progress' }, { status: 409 });
  }

  const startMs = Date.now();

  try {
    const result = await generateRoastVideo({
      bookId,
      slug: book.slug,
      victimName: book.victim_name,
      quotes: book.quotes.slice(0, 8),
      coverImageUrl: book.cover_image_url,
      fullImageUrls: book.full_image_urls.slice(0, 8),
    });

    // Persist result
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

    console.log(`[VIDEO] ✅ Success for ${bookId} in ${Math.round(result.generationTimeMs / 1000)}s`);

    // Send email notification (non-fatal)
    await sendVideoReadyEmail({
      victimName: book.victim_name,
      videoUrl: result.videoUrl,
      bookSlug: book.slug,
      durationSeconds: result.durationSeconds,
      generationTimeMs: result.generationTimeMs,
    });

    return NextResponse.json({
      videoUrl: result.videoUrl,
      durationSeconds: result.durationSeconds,
      generationTimeMs: result.generationTimeMs,
    });

  } catch (err: any) {
    console.error(`[VIDEO] ❌ Failed for ${bookId}:`, err);

    await supabaseAdmin
      .from('roast_books')
      .update({
        video_status: 'failed',
        video_error: err.message || 'Unknown error',
      })
      .eq('id', bookId);

    return NextResponse.json({ error: err.message || 'Video generation failed' }, { status: 500 });
  }
}
