import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { isAdminUser } from '@/lib/admin';
import { inngest } from '@/lib/inngest/client';

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
    .select('id, slug, victim_name, quotes, cover_image_url, full_image_urls, status, video_status, video_url')
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

  // Guard: don't allow duplicate runs
  if (book.video_status === 'processing') {
    console.log(`[VIDEO] Book ${bookId} is already processing`);
    return NextResponse.json({ error: 'Video generation already in progress' }, { status: 409 });
  }

  // Send Inngest event and return immediately - generation runs in the background
  await inngest.send({
    name: 'video/generation.requested',
    data: {
      bookId,
      slug: book.slug,
      victimName: book.victim_name,
      quotes: book.quotes.slice(0, 8),
      coverImageUrl: book.cover_image_url,
      fullImageUrls: book.full_image_urls.slice(0, 8),
    },
  });

  console.log(`[VIDEO] Inngest event queued for book ${bookId}`);

  return NextResponse.json({
    queued: true,
    message: 'Video generation started in background. Poll /api/admin/metrics for status.',
  });
}
