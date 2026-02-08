import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateVisualPrompt } from '@/lib/prompt-engineering';
import { generateRoastImage } from '@/lib/image-generation';
import { downloadAndUploadImage } from '@/lib/utils';
import { withRetryContext } from '@/lib/retry';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { bookId } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
    }

    // Get book data
    const { data: book, error: fetchError } = await supabaseAdmin
      .from('roast_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.status !== 'paid') {
      return NextResponse.json({ error: 'Book not paid' }, { status: 400 });
    }

    // Start background processing (don't wait for response, but handle errors properly)
    processRemainingImages(book).catch(async (err) => {
      console.error(`[${bookId}] ❌ Remaining generation failed:`, err);

      // IMPORTANT: Await the database update
      try {
        await supabaseAdmin
          .from('roast_books')
          .update({ status: 'failed' })
          .eq('id', bookId);
        console.log(`[${bookId}] Status updated to 'failed'`);
      } catch (updateErr) {
        console.error(`[${bookId}] Failed to update error status:`, updateErr);
      }
    });

    return NextResponse.json({ success: true, message: 'Generation started' });

  } catch (error) {
    console.error('Generate remaining error:', error);
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
  }
}

async function processRemainingImages(book: any) {
  const bookId = book.id;
  
  try {
    console.log(`[${bookId}] ========== GENERATING REMAINING 5 IMAGES ==========`);
    
    await supabaseAdmin
      .from('roast_books')
      .update({ status: 'generating_remaining' })
      .eq('id', bookId);

    // Generate prompts for quotes 3-7 (IN PARALLEL with retry logic)
    const remainingQuotes = book.quotes.slice(3, 8);

    const visualPromptPromises = remainingQuotes.map((quote: string, i: number) =>
      withRetryContext(
        () => generateVisualPrompt({
          quote,
          victimDescription: book.victim_description
        }),
        {
          context: `[${bookId}] Prompt ${i + 3}`,
          maxAttempts: 3,
          initialDelayMs: 2000,
        }
      ).then(prompt => {
        console.log(`[${bookId}] ✅ Generated prompt ${i + 3}`);
        return { index: i + 3, prompt };
      }).catch(err => {
        console.error(`[${bookId}] ❌ Error generating prompt ${i + 3}:`, err);
        throw err;
      })
    );

    const visualPrompts = await Promise.all(visualPromptPromises);
    console.log(`[${bookId}] All ${visualPrompts.length} prompts generated`);

    // Generate all 5 images IN PARALLEL with retry logic
    const imagePromises = visualPrompts.map(async ({ index, prompt }) => {
      try {
        console.log(`[${bookId}] Generating image ${index}...`);

        const imageUrl = await withRetryContext(
          () => generateRoastImage({
            prompt,
            victimImageUrl: book.victim_image_url
          }),
          {
            context: `[${bookId}] Image ${index} generation`,
            maxAttempts: 3,
            initialDelayMs: 3000,
          }
        );
        console.log(`[${bookId}] ✅ Image ${index} generated from AI`);

        const storedUrl = await downloadAndUploadImage(
          imageUrl,
          'roast-books',
          `generated/${book.slug}/image_${index}.jpg`
        );
        console.log(`[${bookId}] ✅ Image ${index} uploaded to storage`);

        return { index, url: storedUrl };
      } catch (err) {
        console.error(`[${bookId}] ❌ FAILED image ${index}:`, err);
        throw err;
      }
    });

    const remainingImages = await Promise.all(imagePromises);
    
    // Combine preview (0,1,2) + remaining (3,4,5,6,7)
    const fullImageUrls = [
      ...book.preview_image_urls,
      ...remainingImages.sort((a, b) => a.index - b.index).map(img => img.url)
    ];

    console.log(`[${bookId}] All ${fullImageUrls.length} images ready`);

    // Update book
    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        status: 'complete',
        full_image_urls: fullImageUrls,
      })
      .eq('id', bookId);

    if (updateError) throw updateError;
    
    console.log(`[${bookId}] ========== BOOK COMPLETE ==========`);

  } catch (error) {
    console.error(`[${bookId}] ========== FAILED ==========`, error);
    
    await supabaseAdmin
      .from('roast_books')
      .update({ status: 'failed' })
      .eq('id', book.id);
  }
}