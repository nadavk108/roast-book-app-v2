import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { generateRoastImage } from '@/lib/image-generation';
import { generateVisualPrompt } from '@/lib/prompt-engineering';
import { downloadAndUploadImage } from '@/lib/utils';
import { withRetryContext } from '@/lib/retry';
import { isAdminUser } from '@/lib/admin';

// Add route config to prevent timeout
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let bookId: string | undefined;

  try {
    // Get current user to check admin status
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminMode = isAdminUser(user);

    // Parse body once and store
    const body = await request.json();
    bookId = body.bookId;
    const quotes = body.quotes || [];
    const customGreeting = body.customGreeting || null;

    if (!bookId) {
      return NextResponse.json(
        { error: 'bookId is required' },
        { status: 400 }
      );
    }

    console.log(`[ADMIN MODE: ${adminMode}] Starting generation for book:`, bookId);

    console.log('Starting preview generation for book:', bookId);
    console.log('Quotes received:', quotes);

    // STEP 1: Save quotes to database first
    const { error: updateQuotesError } = await supabaseAdmin
      .from('roast_books')
      .update({
        quotes: quotes,
        custom_greeting: customGreeting,
        status: 'analyzing'  // CHANGED: Using 'analyzing' instead of 'generating_images'
      })
      .eq('id', bookId);

    if (updateQuotesError) {
      console.error('Failed to save quotes:', updateQuotesError);
      throw new Error(`Failed to save quotes: ${updateQuotesError.message}`);
    }

    console.log('✅ Quotes saved successfully');

    // STEP 2: Fetch the book data
    const { data: book, error: fetchError } = await supabaseAdmin
      .from('roast_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (fetchError || !book) {
      console.error('Book fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Book not found after saving quotes' },
        { status: 404 }
      );
    }

    console.log(`[${bookId}] Book fetched:`, {
      id: book.id,
      slug: book.slug,
      quotesCount: book.quotes?.length,
      victimDescription: book.victim_description,
      victimImageUrl: book.victim_image_url,
      victimName: book.victim_name
    });

    // CRITICAL: Check if victim data exists
    if (!book.victim_description) {
      console.error(`[${bookId}] ❌ MISSING victim_description!`);
      throw new Error('Book is missing victim_description - cannot generate images');
    }
    if (!book.victim_image_url) {
      console.error(`[${bookId}] ❌ MISSING victim_image_url!`);
      throw new Error('Book is missing victim_image_url - cannot generate images');
    }

    // STEP 3: Determine how many quotes to generate
    const quotesToGenerate = adminMode
      ? book.quotes // Admin: Generate ALL quotes
      : book.quotes.slice(0, 3); // Regular: Generate first 3 for preview

    if (!quotesToGenerate || quotesToGenerate.length < 1) {
      throw new Error(`Need at least 1 quote, got ${quotesToGenerate?.length || 0}`);
    }

    console.log(`[${bookId}] ${adminMode ? 'ADMIN MODE' : 'PREVIEW MODE'}: Generating ${quotesToGenerate.length} quotes`);

    const previewQuotes = quotesToGenerate;

    // STEP 4: Generate visual prompts for first 3 quotes IN PARALLEL
    console.log(`[${bookId}] Step 1/3: Generating visual prompts...`);
    const promptPromises = previewQuotes.map((quote: string, index: number) =>
      withRetryContext(
        () => generateVisualPrompt({
            quote,
            victimDescription: book.victim_description,
            imageIndex: index,
            totalImages: 8
          }),
        {
          context: `[${bookId}] Prompt ${index}`,
          maxAttempts: 3,
          initialDelayMs: 2000,
        }
      ).then(prompt => {
        console.log(`[${bookId}] ✅ Prompt ${index} generated`);
        return { index, prompt };
      })
    );

    const visualPrompts = await Promise.all(promptPromises);
    console.log(`[${bookId}] All ${visualPrompts.length} prompts generated`);

    // STEP 5: Generate all 3 images IN PARALLEL
    console.log(`[${bookId}] Step 2/3: Generating images...`);
    const imagePromises = visualPrompts.map(async ({ index, prompt }) => {
      try {
        console.log(`[${bookId}] Generating image ${index}...`);

        const imageUrl = await withRetryContext(
          () => generateRoastImage({
            prompt,
            victimImageUrl: book.victim_image_url
          }),
          {
            context: `[${bookId}] Image ${index}`,
            maxAttempts: 3,
            initialDelayMs: 3000,
          }
        );

        console.log(`[${bookId}] ✅ Image ${index} generated from AI`);

        // Upload to Supabase storage
        const storagePath = `generated/${book.slug}/preview_${index}.jpg`;
        const storedUrl = await downloadAndUploadImage(
          imageUrl,
          'roast-books',
          storagePath
        );

        console.log(`[${bookId}] ✅ Image ${index} uploaded to storage`);

        return { index, url: storedUrl };
      } catch (err) {
        console.error(`[${bookId}] ❌ Failed to generate image ${index}:`, err);
        throw err;
      }
    });

    const generatedImages = await Promise.all(imagePromises);

    // Sort by index to ensure correct order
    const sortedImages = generatedImages.sort((a, b) => a.index - b.index);
    const previewImageUrls = sortedImages.map(img => img.url);

    console.log(`[${bookId}] Step 3/3: Saving to database...`);
    console.log(`[${bookId}] Preview URLs:`, previewImageUrls);

    // STEP 6: Update book with generated images
    // Admin: Save to full_image_urls and mark complete
    // Regular: Save to preview_image_urls and mark preview_ready
    // IMPORTANT: Use FIRST Gemini-generated image as cover (best quality)
    const updateData = adminMode
      ? {
          full_image_urls: previewImageUrls,
          cover_image_url: previewImageUrls[0],
          status: 'complete' as const,
        }
      : {
          preview_image_urls: previewImageUrls,
          cover_image_url: previewImageUrls[0],
          status: 'preview_ready' as const,
        };

    console.log(`[${bookId}] Updating book with status: ${updateData.status}`);

    const { data: updatedBook, error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update(updateData)
      .eq('id', bookId)
      .select()
      .single();

    if (updateError) {
      console.error(`[${bookId}] ❌ SUPABASE UPDATE ERROR:`, {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        attemptedData: {
          preview_image_urls: previewImageUrls,
          cover_image_url: previewImageUrls[0],
          status: 'preview_ready',
        }
      });

      return NextResponse.json(
        {
          error: 'Failed to update book with preview URLs',
          details: updateError.message,
          hint: updateError.hint
        },
        { status: 500 }
      );
    }

    console.log(`[${bookId}] ✅ Book updated successfully:`, {
      id: updatedBook.id,
      status: updatedBook.status,
      preview_image_urls: updatedBook.preview_image_urls,
      cover_image_url: updatedBook.cover_image_url
    });

    console.log(`[${bookId}] ========== ${adminMode ? 'FULL BOOK' : 'PREVIEW'} GENERATION COMPLETE ==========`);

    return NextResponse.json({
      success: true,
      previewUrls: previewImageUrls,
      coverUrl: previewImageUrls[0],
      bookId: bookId,
      isComplete: adminMode,
      imageCount: previewImageUrls.length,
    });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorDetails = {
      name: error?.name,
      message: errorMessage,
      stack: errorStack,
      cause: error?.cause,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    };

    console.error(`[${bookId}] ❌ ========== PREVIEW GENERATION FAILED ==========`);
    console.error(`[${bookId}] Error message:`, errorMessage);
    console.error(`[${bookId}] Error details:`, errorDetails);
    if (errorStack) {
      console.error(`[${bookId}] Stack trace:`, errorStack);
    }

    // Update book status to failed - MUST AWAIT
    if (bookId) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('roast_books')
          .update({
            status: 'failed',
            // Note: Add error_message column to DB schema if needed
          })
          .eq('id', bookId);

        if (updateError) {
          console.error(`[${bookId}] Failed to update error status:`, updateError);
        } else {
          console.log(`[${bookId}] Book status updated to 'failed'`);
        }
      } catch (updateError) {
        console.error(`[${bookId}] Exception updating error status:`, updateError);
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        bookId: bookId,
        errorDetails: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}