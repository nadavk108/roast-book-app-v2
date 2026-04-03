import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateBookSlug } from '@/lib/utils';
import { createClient } from '@/lib/supabase-server';

// Increase timeout for file uploads
export const maxDuration = 30; // 30 seconds

// Note: Body size limit in Vercel is 4.5MB for Hobby plan
// Vercel Pro supports up to 10MB
// We handle this on the client side by checking file size before upload

export async function POST(request: NextRequest) {
  console.log('Upload route called');
  try {
    // Attempt to get authenticated user (optional - anonymous uploads are allowed)
    const supabase = createClient();
    console.log('Checking authentication...');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('User authenticated:', user?.email || 'anonymous');

    const formData = await request.formData();
    const victimName = formData.get('victimName') as string;
    const victimGender = (formData.get('victimGender') as string) || 'neutral';
    const imageFile = formData.get('image') as File;
    const sessionToken = (formData.get('session_token') as string) || null;

    console.log('Form data received:', { victimName, victimGender, hasImage: !!imageFile, hasSessionToken: !!sessionToken });

    // If no authenticated user, a session_token is required to track the anonymous book
    if (!user && !sessionToken) {
      console.log('No user and no session_token - unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in or provide a session token' },
        { status: 401 }
      );
    }

    if (!victimName || !imageFile) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = generateBookSlug();
    // Storage path uses slug (not user_id) so anonymous uploads work fine
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

    // Create database record.
    // user_id is set if authenticated, null for anonymous users.
    // session_token is always stored when provided (safety net for future claim).
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
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        session_token: sessionToken,
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
