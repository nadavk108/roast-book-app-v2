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
Your job is to turn a victim's real traits, passions, and obsessions into ${count} short quotes that betray their identity — things their friends will instantly recognize as wrong for them.

These quotes must sound like real things someone might say in public, but they must represent the most boring, square, or socially mismatched version of a person relative to who the victim actually is.

Do NOT write obvious opposites. Do NOT write direct negations of their interests. Do NOT insult the victim directly. The humor must come from identity betrayal and cringe, not cruelty.

---

STEP 1 — TRAIT EXTRACTION:
Before generating any quotes, extract as many DISTINCT traits/habits/obsessions as you can from the description. If there are fewer than ${count}, that's OK — you'll reuse some.

STEP 2 — MAXIMIZE VARIETY:
Assign one quote per distinct trait FIRST. Only after every trait has been used once, go back and create additional quotes from existing traits — BUT with a completely different scenario and action.

Good reuse: Trait "clean freak" → Quote 1: "Hotels are the cleanest, I trust them" + Quote 6: "Come in with shoes, no problem" (same trait, totally different scenario and visual)
Bad reuse: Trait "clean freak" → Quote 1: "Hotels are the cleanest" + Quote 2: "I trust hotel hygiene completely" (same trait, same scenario = duplicates — REJECT)

STEP 3 — THE VISUAL ACTION TEST:
Every quote MUST describe or imply a SPECIFIC ACTION the person would never do. Not an opinion, not a belief, not a philosophical statement. The image AI will need to show this person DOING something — if you can't picture it as a single funny scene, rewrite it.

Good: "I only have one pair of sunglasses, who needs more?" (implies giving away sunglasses — easy to visualize)
Good: "Fold laundry? Just throw it in the closet" (implies hurling clothes into a messy closet — instant visual)
Good: "Electric bikes? Way too dangerous" (implies warning people away from e-bikes — clear scene)
Bad: "Sports is a waste of time" (generic opinion, no specific action — REJECT)
Bad: "Physiotherapy is fiction" (abstract belief, impossible to picture — REJECT)
Bad: "I don't see drama in hotel cleanliness" (vague, no specific action — REJECT)

STEP 4 — THE UNIVERSALITY TEST:
The quote must be funny without needing cultural insider knowledge. Avoid references to specific local sports teams, local celebrities, regional food customs, or anything that requires geographic context to understand the humor. The humor must work for anyone who knows the person.

STEP 5 — COMEDY STYLE (pick the most ironic mode per trait):
- If they love chaos, parties, nightlife → Make them sound like a wellness influencer or early-bed productivity bro
- If they love junk food → Make them sound like a flavorless health purist
- If they love tech, gadgets, startups → Make them sound nostalgic, analog, and anti-innovation
- If they love shopping, brands, flexing → Make them sound like a monk who hates possessions
- If they love weed, rebellion, laziness → Make them sound like a hyper-responsible rule enforcer
- If they are messy or late → Make them sound neurotically punctual and organized

TONE RULES:
- Funny but not mean
- Subtle cringe beats obvious reversal
- No swearing
- No direct mention of their real traits
- No sarcasm that sounds written by AI
- Must sound like something someone could actually say in public

${hebrewInstruction}

OUTPUT RULES (STRICT):
- Return exactly ${count} quotes
- Each quote must be 5-15 words
- First person only ("I...", "My...", "Who needs...")
- Describe or strongly imply a concrete, visible action
- Maximize trait variety: use every unique trait before reusing any
- When reusing a trait, use a completely different scenario and action
- Be instantly understandable without explanation
- Return ONLY a JSON object: {"quotes": ["quote1", "quote2", ...]}
- No extra text, no explanations

QUALITY FILTER (MENTAL CHECK BEFORE OUTPUT):
If a quote:
- Could apply to anyone → reject it
- Is an abstract opinion with no implied action → reject it
- Duplicates the scenario of another quote → rewrite it
- Cannot be visualized as a single funny scene → rewrite it
- Sounds like a joke setup → reject it
- Feels too mean → soften it`;

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

        // Save traits to book if bookId provided
        if (bookId) {
          const { error: traitsError } = await supabaseAdmin
            .from('roast_books')
            .update({ victim_traits: trueTraits })
            .eq('id', bookId);

          if (traitsError) {
            console.error('Failed to save traits:', traitsError);
          } else {
            console.log(`[${bookId}] ✅ Saved victim_traits to database`);
          }
        }

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