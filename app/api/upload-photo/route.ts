import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const bookId = formData.get('bookId') as string;
    const imageFile = formData.get('image') as File;

    if (!bookId || !imageFile) {
      return NextResponse.json({ error: 'Missing bookId or image' }, { status: 400 });
    }

    // Fetch book to get slug for storage path
    const { data: book, error: fetchError } = await supabaseAdmin
      .from('roast_books')
      .select('slug')
      .eq('id', bookId)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const imagePath = `victims/${book.slug}/${imageFile.name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('roast-books')
      .upload(imagePath, imageFile, {
        contentType: imageFile.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('upload-photo: storage error:', uploadError);
      return NextResponse.json({ error: `Failed to upload image: ${uploadError.message}` }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('roast-books')
      .getPublicUrl(imagePath);

    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({ victim_image_url: urlData.publicUrl })
      .eq('id', bookId);

    if (updateError) {
      console.error('upload-photo: DB update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, imageUrl: urlData.publicUrl });
  } catch (error: any) {
    console.error('upload-photo error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
