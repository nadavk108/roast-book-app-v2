import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';
import { isPredominantlyHebrew, getHebrewPromptInstruction } from '@/lib/hebrew-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
  timeout: 60000,
  maxRetries: 2,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, victimName, trueTraits } = body;

    // Support two modes: bookId-based (for automated generation) or traits-based (for assistant)
    if (victimName && trueTraits) {
      // Traits-based generation for Roast Assistant
      console.log('Generating quotes from traits:', { victimName, trueTraits });

      // Detect if input is in Hebrew
      const isHebrew = isPredominantlyHebrew(victimName) || isPredominantlyHebrew(trueTraits);
      const hebrewInstruction = isHebrew ? getHebrewPromptInstruction() : '';

      const quotesResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a Lead Satirist for "The Roast Book." Your task is to generate 8 razor-sharp, hilarious quotes titled "Things [Victim Name] Would Never Say."

CRITICAL STRATEGY: Do not just invert their traits. Instead, force the victim to adopt the persona of their "Mortal Enemy"—the most boring, corporate, or judgmental version of a person who would find the victim's actual passions repulsive or "unprofessional."

STYLING ARCHETYPES:
- If they are a Rebel/Artist: Make them sound like a high-strung HR Manager.
- If they are Tech-Obsessed: Make them sound like a 19th-century Luddite.
- If they are a Foodie: Make them sound like they find flavor "taxing" and "unnecessary."
- If they are a Fitness Junkie: Make them sound like someone who views a flight of stairs as an "insurmountable safety hazard."

EXAMPLES:
- Trait (Loves Crypto): "I've decided to move my life savings into a high-interest savings account. Slow and steady wins the race!"
- Trait (Loves Weed): "I find that a crisp glass of lukewarm water provides all the 'recreation' a law-abiding citizen needs."
- Trait (Loves Fashion): "Is it possible to get this shirt in a more 'utilitarian' shade of oatmeal? I find self-expression distracting."

${hebrewInstruction}

OUTPUT RULES:
- Exactly 8 quotes.
- Under 15 words each.
- Short and punchy.
- Return ONLY a JSON object with a "quotes" array: {"quotes": ["quote1", "quote2", ...]}.`,
          },
          {
            role: 'user',
            content: `Person: ${victimName}\nThings they actually love/do: ${trueTraits}\n\nGenerate 8 hilarious quotes using the "Mortal Enemy" approach. Format: {"quotes": ["quote1", "quote2", ...]}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(quotesResponse.choices[0].message.content || '{"quotes": []}');
      const quotes = parsed.quotes;

      console.log('Generated quotes:', quotes);

      return NextResponse.json({
        success: true,
        quotes,
      });
    }

    // BookId-based generation (original flow)
    if (!bookId) {
      return NextResponse.json(
        { error: 'Missing bookId or victimName/trueTraits' },
        { status: 400 }
      );
    }

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

    console.log('Generating quotes for book:', bookId);

    // Detect if the victim description is in Hebrew
    const isHebrew = isPredominantlyHebrew(book.victim_description || '') ||
      isPredominantlyHebrew(book.victim_name || '');
    const hebrewInstruction = isHebrew ? getHebrewPromptInstruction() : '';

    console.log('Hebrew detection:', { isHebrew, victimDescription: book.victim_description });

    // Generate 6 roast quotes
    const quotesResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a Lead Satirist for "The Roast Book." Your task is to generate 6 razor-sharp, hilarious quotes titled "Things [Victim Name] Would Never Say."

CRITICAL STRATEGY: Do not just invert their traits. Instead, force the victim to adopt the persona of their "Mortal Enemy"—the most boring, corporate, or judgmental version of a person who would find the victim's actual passions repulsive or "unprofessional."

STYLING ARCHETYPES:
- If they are a Rebel/Artist: Make them sound like a high-strung HR Manager.
- If they are Tech-Obsessed: Make them sound like a 19th-century Luddite.
- If they are a Foodie: Make them sound like they find flavor "taxing" and "unnecessary."
- If they are a Fitness Junkie: Make them sound like someone who views a flight of stairs as an "insurmountable safety hazard."

EXAMPLES:
- Trait (Loves Crypto): "I've decided to move my life savings into a high-interest savings account. Slow and steady wins the race!"
- Trait (Loves Weed): "I find that a crisp glass of lukewarm water provides all the 'recreation' a law-abiding citizen needs."
- Trait (Loves Fashion): "Is it possible to get this shirt in a more 'utilitarian' shade of oatmeal? I find self-expression distracting."

${hebrewInstruction}

OUTPUT RULES:
- Exactly 6 quotes.
- Under 15 words each.
- Short and punchy.
- Return ONLY a JSON object with a "quotes" array: {"quotes": ["quote1", "quote2", ...]}.`,
        },
        {
          role: 'user',
          content: `Based on this person's appearance and vibe: ${book.victim_description}\n\nInfer their personality and generate 6 hilarious quotes using the "Mortal Enemy" approach. Format: {"quotes": ["quote1", "quote2", ...]}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(quotesResponse.choices[0].message.content || '{"quotes": []}');
    const quotes = parsed.quotes;

    console.log('Generated quotes:', quotes);

    // Update book with quotes (keep status as 'analyzing' until preview is ready)
    const { error: updateError } = await supabaseAdmin
      .from('roast_books')
      .update({
        quotes: quotes,
        status: 'analyzing',
      })
      .eq('id', bookId);

    if (updateError) {
      console.error('Failed to update book:', updateError);
      return NextResponse.json(
        { error: 'Failed to update book' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quotes,
    });
  } catch (error) {
    console.error('Quote generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quotes' },
      { status: 500 }
    );
  }
}