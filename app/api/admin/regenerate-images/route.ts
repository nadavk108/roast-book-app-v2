import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';
import { isAdminUser } from '@/lib/admin';
import { generateVisualPrompt } from '@/lib/prompt-engineering';
import { generateRoastImage } from '@/lib/image-generation';
import { downloadAndUploadImage } from '@/lib/utils';
import { withRetryContext } from '@/lib/retry';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let bookId: string | undefined;

  try {
    // Admin guard
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    bookId = body.bookId;

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

    if (!book.quotes?.length) {
      return NextResponse.json({ error: 'Book has no quotes' }, { status: 400 });
    }
    if (!book.victim_image_url) {
      return NextResponse.json({ error: 'Book has no victim image' }, { status: 400 });
    }

    console.log(`[REGEN ${bookId}] Starting full image regeneration (${book.quotes.length} quotes)`);

    // Reset book state
    const { error: resetError } = await supabaseAdmin
      .from('roast_books')
      .update({
        status: 'generating_images',
        preview_image_urls: [],
        full_image_urls: [],
        cover_image_url: null,
      })
      .eq('id', bookId);

    if (resetError) throw new Error(`Failed to reset book: ${resetError.message}`);

    // Generate visual prompts for all quotes in parallel
    console.log(`[REGEN ${bookId}] Generating ${book.quotes.length} visual prompts...`);
    const promptResults = await Promise.all(
      book.quotes.map((quote: string, index: number) =>
        withRetryContext(
          () => generateVisualPrompt({
            quote,
            victimDescription: book.victim_description,
            victimTraits: book.victim_traits || '',
            imageIndex: index,
            totalImages: book.quotes.length,
          }),
          { context: `[REGEN ${bookId}] Prompt ${index}`, maxAttempts: 3, initialDelayMs: 2000 }
        ).then(prompt => {
          console.log(`[REGEN ${bookId}] ✅ Prompt ${index} done`);
          return { index, prompt };
        })
      )
    );

    // Generate and upload all images in parallel
    console.log(`[REGEN ${bookId}] Generating ${promptResults.length} images...`);
    const imageResults = await Promise.all(
      promptResults.map(async ({ index, prompt }) => {
        const imageUrl = await withRetryContext(
          () => generateRoastImage({ prompt, victimImageUrl: book.victim_image_url }),
          { context: `[REGEN ${bookId}] Image ${index}`, maxAttempts: 3, initialDelayMs: 3000 }
        );

        const storedUrl = await downloadAndUploadImage(
          imageUrl,
          'roast-books',
          `generated/${book.slug}/regen_${index}_${Date.now()}.jpg`
        );

        console.log(`[REGEN ${bookId}] ✅ Image ${index} uploaded`);
        return { index, url: storedUrl };
      })
    );

    const fullImageUrls = imageResults
      .sort((a, b) => a.index - b.index)
      .map(img => img.url);

    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        status: 'complete',
        full_image_urls: fullImageUrls,
        preview_image_urls: fullImageUrls.slice(0, 3),
        cover_image_url: fullImageUrls[0],
      })
      .eq('id', bookId);

    if (updateError) throw new Error(`Failed to save images: ${updateError.message}`);

    console.log(`[REGEN ${bookId}] ========== COMPLETE (${fullImageUrls.length} images) ==========`);

    return NextResponse.json({ success: true, imageCount: fullImageUrls.length });

  } catch (error: any) {
    console.error(`[REGEN ${bookId}] Failed:`, error);

    if (bookId) {
      await supabaseAdmin
        .from('roast_books')
        .update({ status: 'failed' })
        .eq('id', bookId);
    }

    return NextResponse.json({ error: error.message || 'Regeneration failed' }, { status: 500 });
  }
}
