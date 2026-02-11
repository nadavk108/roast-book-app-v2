import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';
import { isPredominantlyHebrew, getHebrewPromptInstruction } from '@/lib/hebrew-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
  timeout: 60000,
  maxRetries: 2,
});

const QUOTE_SYSTEM_PROMPT = (count: number, hebrewInstruction: string) => `You are the Lead Comedy Writer for The Roast Book.
Your job is to turn a victim's real traits, passions, and obsessions into ${count} short quotes that betray their identity in a way their friends will instantly recognize as wrong for them.

These quotes must sound like real things someone might say, but they must represent the most boring, square, or socially mismatched version of a person relative to who the victim actually is.

Do NOT write obvious opposites. Do NOT write direct negations of their interests. Do NOT insult the victim directly. The humor must come from identity betrayal and cringe, not cruelty.

COMEDY ENGINE (MANDATORY)
Each quote must:
- Sound natural in conversation
- Reveal a personality the victim would never become
- Imply the victim has turned into:
  - A rule-follower
  - A snob
  - A wellness extremist
  - A minimalist monk
  - Or a corporate square
- Feel socially embarrassing to imagine them saying

Think: "This would be horrifying to hear them say out loud."

STYLE MODES (Pick the most ironic mode per trait)
- If they love chaos, parties, nightlife → Make them sound like a wellness influencer or early-bed productivity bro
- If they love junk food → Make them sound like a flavorless health purist
- If they love tech, gadgets, startups → Make them sound nostalgic, analog, and anti-innovation
- If they love shopping, brands, flexing → Make them sound like a monk who hates possessions
- If they love weed, rebellion, laziness → Make them sound like a hyper-responsible rule enforcer
- If they are messy or late → Make them sound neurotically punctual and organized

TONE RULES
- Funny but not mean
- Subtle cringe beats obvious reversal
- No swearing
- No direct mention of their real traits
- No sarcasm that sounds written by AI
- Must sound like something someone could actually say in public

${hebrewInstruction}

OUTPUT RULES (STRICT)
- Return exactly ${count} quotes
- Each quote must be under 15 words
- Return ONLY a JSON object with a "quotes" array: {"quotes": ["quote1", "quote2", ...]}
- No extra text, no explanations

QUALITY FILTER (MENTAL CHECK BEFORE OUTPUT)
If the quote:
- Could apply to anyone → reject it
- Sounds like a joke setup → reject it
- Is just "I don't like X" → reject it
- Feels too mean → soften it
- Would not embarrass the victim socially → rewrite it`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, victimName, trueTraits } = body;

    // Traits-based generation for Roast Assistant ("Need help" button)
    if (victimName && trueTraits) {
      console.log('Generating quotes from traits:', { victimName, trueTraits });

      const isHebrew = isPredominantlyHebrew(victimName) || isPredominantlyHebrew(trueTraits);
      const hebrewInstruction = isHebrew ? getHebrewPromptInstruction() : '';

      const quotesResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: QUOTE_SYSTEM_PROMPT(8, hebrewInstruction),
          },
          {
            role: 'user',
            content: `Person: ${victimName}\nThings they actually love/do: ${trueTraits}\n\nGenerate 8 quotes that betray their identity. Format: {"quotes": ["quote1", "quote2", ...]}`,
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

    // BookId-based generation (automated flow)
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

    const isHebrew = isPredominantlyHebrew(book.victim_description || '') ||
      isPredominantlyHebrew(book.victim_name || '');
    const hebrewInstruction = isHebrew ? getHebrewPromptInstruction() : '';

    const quotesResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: QUOTE_SYSTEM_PROMPT(6, hebrewInstruction),
        },
        {
          role: 'user',
          content: `Based on this person's appearance and vibe: ${book.victim_description}\n\nInfer their personality and generate 6 quotes that betray their identity. Format: {"quotes": ["quote1", "quote2", ...]}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(quotesResponse.choices[0].message.content || '{"quotes": []}');
    const quotes = parsed.quotes;

    console.log('Generated quotes:', quotes);

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