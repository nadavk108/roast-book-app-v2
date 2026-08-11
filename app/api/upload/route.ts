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

    // Validate photo contains exactly one real human face — fail closed on error
    try {
      const validation = await validateHumanFace(imageFile);
      if (!validation.valid) {
        console.log('Photo rejected by face validation:', validation.errorMessage);
        return NextResponse.json({ error: validation.errorMessage }, { status: 422 });
      }
    } catch (validationErr: any) {
      console.error('Face validation call failed:', validationErr?.message);
      return NextResponse.json(
        { error: 'Unable to validate your photo. Please try again.' },
        { status: 422 }
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

async function validateHumanFace(
  imageFile: File,
): Promise<{ valid: boolean; errorMessage: string | null }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const bytes = await imageFile.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mimeType = imageFile.type || 'image/jpeg';

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64 } },
        {
          text: `Analyze this image. Reply with ONLY a JSON object, no markdown, no explanation:
{"is_human_face":true,"face_count":1}

Rules:
- is_human_face: true ONLY if there is exactly one clearly visible real human face
- face_count: integer count of human faces (0 if none)
- Set is_human_face to false if image contains: animals, cartoons, memes, objects, screenshots, phone screens, or multiple people`,
        },
      ],
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 60 },
  });

  // Strip markdown fences Gemini sometimes wraps around JSON
  const raw = result.response.text().trim().replace(/^```(?:json)?\n?|\n?```$/g, '');
  const parsed = JSON.parse(raw) as { is_human_face: boolean; face_count: number };

  if (parsed.is_human_face === true) return { valid: true, errorMessage: null };

  const count = parsed.face_count ?? 0;
  if (count === 0) {
    return { valid: false, errorMessage: 'No face detected - please upload a clear photo of the person.' };
  }
  if (count > 1) {
    return { valid: false, errorMessage: 'Multiple faces detected - please upload a photo with just one person.' };
  }
  return { valid: false, errorMessage: 'Please upload a real photo of a person - no animals, memes, or objects.' };
}
