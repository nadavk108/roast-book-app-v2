import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
  timeout: 60000,
  maxRetries: 2,
});

export async function POST(request: NextRequest) {
  try {
    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json(
        { error: 'Missing bookId' },
        { status: 400 }
      );
    }

    // Get book data
    const { data: book, error: fetchError } = await supabaseAdmin
      .from('roast_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (fetchError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    console.log(`[ANALYZE ${bookId}] Starting image analysis...`);
    console.log(`[ANALYZE ${bookId}] Image URL:`, book.victim_image_url);

    // Download image from Supabase first to avoid OpenAI timeout issues
    console.log(`[ANALYZE ${bookId}] Downloading image from Supabase...`);
    let imageBase64;
    try {
      const imageResponse = await fetch(book.victim_image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(imageBuffer).toString('base64');
      console.log(`[ANALYZE ${bookId}] Image downloaded, size: ${imageBuffer.byteLength} bytes`);
    } catch (downloadError: any) {
      console.error(`[ANALYZE ${bookId}] Failed to download image:`, downloadError);
      return NextResponse.json(
        { error: `Failed to download image: ${downloadError.message}` },
        { status: 400 }
      );
    }

    // Analyze the victim image with GPT-4 Vision
    // Using base64 encoding to avoid timeout issues
    console.log(`[ANALYZE ${bookId}] Calling GPT-4 Vision...`);
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe the physical appearance of the character in this image for a fictional story. Focus on hair color, hairstyle, approximate age, and clothing. Do not identify who they are, just describe their look.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const victimDescription = visionResponse.choices[0].message.content;

    console.log('Generated description:', victimDescription);

    // Check if OpenAI refused to analyze
    if (!victimDescription || victimDescription.toLowerCase().includes("i'm sorry") || victimDescription.toLowerCase().includes("can't help")) {
      console.error('OpenAI refused to analyze the image');
      return NextResponse.json(
        { error: 'Unable to analyze this image. Please try a different photo.' },
        { status: 400 }
      );
    }

    // Update book with description (keep status as 'analyzing' - will change to 'preview_ready' after generation)
    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        victim_description: victimDescription,
        // Status remains 'analyzing' - will be updated by generate-preview
      })
      .eq('id', bookId);

    if (updateError) {
      console.error('Failed to update book:', updateError);
      return NextResponse.json(
        { error: 'Failed to update book' },
        { status: 500 }
      );
    }

    console.log(`[ANALYZE ${bookId}] ✅ Analysis complete`);
    return NextResponse.json({
      success: true,
      description: victimDescription,
    });
  } catch (error: any) {
    console.error(`[ANALYZE] ❌ Analysis failed:`, error);
    console.error(`[ANALYZE] Error name:`, error?.name);
    console.error(`[ANALYZE] Error message:`, error?.message);
    console.error(`[ANALYZE] Error code:`, error?.code);
    console.error(`[ANALYZE] Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));

    return NextResponse.json(
      {
        error: error?.message || 'Failed to analyze image',
        errorDetails: {
          name: error?.name,
          message: error?.message,
          code: error?.code,
        }
      },
      { status: 500 }
    );
  }
}