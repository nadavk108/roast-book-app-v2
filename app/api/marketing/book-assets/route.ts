import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const secret = searchParams.get('secret');

  const expectedSecret = (process.env.MARKETING_AGENT_SECRET || '').trim();

  if (!expectedSecret || !secret || secret.trim() !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  const { data: book, error } = await supabaseAdmin
    .from('roast_books')
    .select('victim_image_url, full_image_urls, preview_image_urls, quotes, victim_name, status')
    .eq('slug', slug.trim())
    .single();

  if (error || !book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  if (book.status !== 'complete' && book.status !== 'paid') {
    return NextResponse.json(
      { error: 'Book is not ready for marketing', status: book.status },
      { status: 400 }
    );
  }

  const generatedImages =
    book.full_image_urls && book.full_image_urls.length > 0
      ? book.full_image_urls
      : book.preview_image_urls ?? [];

  return NextResponse.json({
    original_image_url: book.victim_image_url,
    generated_images: generatedImages,
    quotes: book.quotes,
    subject_name: book.victim_name,
    status: book.status,
  });
}
