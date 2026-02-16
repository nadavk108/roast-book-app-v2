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

    const { data: book, error: fetchError } = await supabaseAdmin
      .from('roast_books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.status !== 'paid') {
        if (book.status === 'complete' && book.full_image_urls?.length > 0) {
          console.log(`[${bookId}] ⚠️ GUARD: Book already complete, skipping`);
          return NextResponse.json({ success: true, message: 'Already complete', skipped: true });
        }
        if (book.status === 'generating_remaining') {
          console.log(`[${bookId}] ⚠️ GUARD: Already generating, skipping`);
          return NextResponse.json({ success: true, message: 'Already generating', skipped: true });
        }
        return NextResponse.json({ error: 'Book not paid' }, { status: 400 });
      }

      // ATOMIC LOCK: Only proceed if we can claim the status
      const { data: lockResult } = await supabaseAdmin
        .from('roast_books')
        .update({ status: 'generating_remaining' })
        .eq('id', bookId)
        .eq('status', 'paid')
        .select('id')
        .maybeSingle();

      if (!lockResult) {
        console.log(`[${bookId}] ⚠️ LOCK: Status already changed, skipping`);
        return NextResponse.json({ success: true, message: 'Already processing', skipped: true });
      }

      // AWAIT the processing — do NOT fire-and-forget on Vercel
      const result = await processRemainingImages(book);

    return NextResponse.json({ success: true, message: 'Generation complete', result });

  } catch (error: any) {
    console.error('Generate remaining error:', error);
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 });
  }
}

async function processRemainingImages(book: any) {
  const bookId = book.id;

  console.log(`[${bookId}] ========== GENERATING REMAINING 5 IMAGES ==========`);

  // Status already set to 'generating_remaining' by atomic lock above
    console.log(`[${bookId}] Generation lock confirmed, proceeding...`);

  try {
    const remainingQuotes = book.quotes.slice(3);
    console.log(`[${bookId}] Processing ${remainingQuotes.length} remaining quotes`);

    const visualPromptPromises = remainingQuotes.map((quote: string, i: number) =>
      withRetryContext(
       () => generateVisualPrompt({
            quote,
            victimDescription: book.victim_description,
            victimTraits: book.victim_traits || '',
            imageIndex: i + 3,
            totalImages: book.quotes.length
          }),
        {
          context: `[${bookId}] Prompt ${i + 3}`,
          maxAttempts: 3,
          initialDelayMs: 2000,
        }
      ).then(prompt => {
        console.log(`[${bookId}] ✅ Generated prompt ${i + 3}`);
        return { index: i + 3, prompt };
      })
    );

    const visualPrompts = await Promise.all(visualPromptPromises);
    console.log(`[${bookId}] All ${visualPrompts.length} prompts generated`);

    const imagePromises = visualPrompts.map(async ({ index, prompt }) => {
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
        `generated/${book.slug}/image_${index}_${Date.now()}.jpg`
      );
      console.log(`[${bookId}] ✅ Image ${index} uploaded to storage`);

      return { index, url: storedUrl };
    });

    const remainingImages = await Promise.all(imagePromises);

    const fullImageUrls = [
      ...book.preview_image_urls,
      ...remainingImages.sort((a, b) => a.index - b.index).map(img => img.url)
    ];

    console.log(`[${bookId}] All ${fullImageUrls.length} images ready`);

    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        status: 'complete',
        full_image_urls: fullImageUrls,
      })
      .eq('id', bookId);

    if (updateError) throw updateError;

    console.log(`[${bookId}] ========== BOOK COMPLETE ==========`);
    return { totalImages: fullImageUrls.length };

  } catch (error) {
    console.error(`[${bookId}] ========== FAILED ==========`, error);

    await supabaseAdmin
      .from('roast_books')
      .update({ status: 'failed' })
      .eq('id', bookId);

    throw error;
  }
}