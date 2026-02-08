import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateBookSlug } from '@/lib/utils';
import { createClient } from '@/lib/supabase-server';

// Increase timeout for file uploads
export const maxDuration = 30; // 30 seconds

// Increase body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(request: NextRequest) {
  console.log('Upload route called');
  try {
    // Get authenticated user
    const supabase = createClient();
    console.log('Checking authentication...');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('No user found - unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.email);

    const formData = await request.formData();
    const victimName = formData.get('victimName') as string;
    const victimGender = formData.get('victimGender') as string || 'neutral';
    const imageFile = formData.get('image') as File;

    console.log('Form data received:', { victimName, victimGender, hasImage: !!imageFile });

    if (!victimName || !imageFile) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = generateBookSlug();
    const imagePath = `victims/${slug}/${imageFile.name}`;

    console.log('Uploading to Supabase storage:', imagePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('roast-books')
      .upload(imagePath, imageFile, {
        contentType: imageFile.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log('Image uploaded successfully');

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('roast-books')
      .getPublicUrl(imagePath);

    console.log('Creating database record...');

    // Create database record with user_id
    const { data: bookData, error: dbError } = await supabaseAdmin
      .from('roast_books')
      .insert({
        victim_name: victimName,
        victim_gender: victimGender,
        victim_image_url: urlData.publicUrl,
        slug: slug,
        status: 'analyzing',
        quotes: [],
        preview_image_urls: [],
        full_image_urls: [],
        user_id: user.id,
        user_email: user.email,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        { error: `Failed to create book record: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log('Book created successfully:', bookData.id);

    // Return immediately - generation will happen async
    // The client will redirect to the quotes page where they can continue

    return NextResponse.json({
      bookId: bookData.id,
      slug: slug,
    });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}