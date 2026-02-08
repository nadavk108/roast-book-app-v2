import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Disable caching to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const identifier = params.id;
    
    // Check if it's a UUID (long) or slug (short)
    const isUUID = identifier.length > 20;
    
    const { data: book, error } = await supabaseAdmin
      .from('roast_books')
      .select('*')
      .eq(isUUID ? 'id' : 'slug', identifier)
      .single();

    if (error || !book) {
      console.error('Book fetch error:', error);
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    console.log('Book fetched:', {
      id: book.id,
      slug: book.slug,
      status: book.status,
      preview_image_urls: book.preview_image_urls
    });

    return NextResponse.json(book);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}