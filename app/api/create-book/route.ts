import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateBookSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const victimName = (body.victimName as string)?.trim();
    const victimGender = (body.victimGender as string) || 'neutral';
    const description = (body.description as string)?.trim() || '';
    const sessionToken = (body.session_token as string) || null;

    if (!victimName) {
      return NextResponse.json({ error: 'Missing victimName' }, { status: 400 });
    }

    const slug = generateBookSlug();

    const { data: bookData, error: dbError } = await supabaseAdmin
      .from('roast_books')
      .insert({
        victim_name: victimName,
        victim_gender: victimGender,
        victim_traits: description,
        victim_image_url: '',
        slug,
        status: 'analyzing',
        quotes: [],
        preview_image_urls: [],
        full_image_urls: [],
        user_id: null,
        user_email: null,
        session_token: sessionToken,
      })
      .select()
      .single();

    if (dbError) {
      console.error('create-book: DB insert error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ bookId: bookData.id, slug });
  } catch (error: any) {
    console.error('create-book error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
