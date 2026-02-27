import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';
import { isPredominantlyHebrew, getHebrewPromptInstruction } from '@/lib/hebrew-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
  timeout: 60000,
  maxRetries: 2,
});

const QUOTE_SYSTEM_PROMPT = (count: number, hebrewInstruction: string): string => {
  const isHeb = hebrewInstruction.length > 0;
  const wordLimit = isHeb ? '8-20' : '5-15';

  return `${isHeb ? hebrewInstruction + '\n---\n\n' : ''}You are the Lead Comedy Writer for The Roast Book.
Your job is to turn a victim's real traits, passions, and obsessions into ${count} short quotes that betray their identity, things their friends will instantly recognize as wrong for them.

These quotes must sound like real things someone might say in public, but they must represent the most boring, square, or socially mismatched version of a person relative to who the victim actually is.

Do NOT write obvious opposites. Do NOT write direct negations of their interests. Do NOT insult the victim directly. The humor must come from identity betrayal and cringe, not cruelty.

---

STEP 1 - TRAIT EXTRACTION:
Before generating any quotes, extract as many DISTINCT traits/habits/obsessions as you can from the description. If there are fewer than ${count}, that's OK, you'll reuse some.

STEP 2 - MAXIMIZE VARIETY:
Assign one quote per distinct trait FIRST. Only after every trait has been used once, go back and create additional quotes from existing traits, BUT with a completely different scenario and action.

Good reuse: Trait "clean freak" → Quote 1: "Hotels are the cleanest, I trust them" + Quote 6: "Come in with shoes, no problem" (same trait, totally different scenario)
Bad reuse: Same trait, same scenario, slightly rephrased → REJECT

STEP 3 - THE VISUAL ACTION TEST:
Every quote MUST describe or imply a SPECIFIC ACTION the person would never do. Not an opinion, not a belief, the image AI must be able to show this person DOING something.

Good: "I only have one pair of sunglasses, who needs more?" (implies giving away sunglasses, easy to visualize)
Good: "Fold laundry? Just throw it in the closet" (implies hurling clothes into a messy closet, instant visual)
Bad: "Sports is a waste of time" (generic opinion, no specific action, REJECT)
Bad: "Physiotherapy is fiction" (abstract belief, impossible to picture, REJECT)

STEP 4 - COMEDY STYLE (pick the most ironic mode per trait):
- Loves chaos, parties, nightlife → Sound like a wellness influencer or early-bed productivity bro
- Loves junk food → Sound like a flavorless health purist
- Loves tech, gadgets, startups → Sound nostalgic, analog, and anti-innovation
- Loves shopping, brands, flexing → Sound like a monk who hates possessions
- Loves weed, rebellion, laziness → Sound like a hyper-responsible rule enforcer
- Messy or always late → Sound neurotically punctual and organized

TONE RULES:
- Funny but not mean
- Subtle cringe beats obvious reversal
- No swearing
- No direct mention of their real traits
- Must sound like something someone could actually say in public

OUTPUT RULES (STRICT):
- Return exactly ${count} quotes
- Each quote must be ${wordLimit} words
- First person only ("I...", "My...", "Who needs...")
- Describe or strongly imply a concrete, visible action
- Maximize trait variety: use every unique trait before reusing any
- When reusing a trait, use a completely different scenario and action
- Return ONLY a JSON object: {"quotes": ["quote1", "quote2", ...]}
- No extra text, no explanations

QUALITY FILTER (MENTAL CHECK BEFORE OUTPUT):
If a quote:
- Could apply to anyone → reject it
- Is an abstract opinion with no implied action → reject it
- Duplicates the scenario of another quote → rewrite it
- Cannot be visualized as a single funny scene → rewrite it${isHeb ? '\n- Sounds stiff, literary, or unnatural in spoken Hebrew → reject it' : ''}
- Feels too mean → soften it`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, victimName, trueTraits } = body;

    // Traits-based generation for Roast Assistant ("Need help" button)
    if (victimName && trueTraits) {
      console.log('Generating quotes from traits:', { victimName, trueTraits });

      const isHebrew = isPredominantlyHebrew(victimName) || isPredominantlyHebrew(trueTraits);
      const hebrewInstruction = isHebrew ? getHebrewPromptInstruction() : '';

      const userMessage = isHebrew
        ? `השם: ${victimName}\nתיאור האישיות המלא - קרא בעיון וזהה כל תכונה ייחודית:\n${trueTraits}\n\nכתוב 8 ציטוטים שמציגים את ${victimName} עושה בדיוק את ההיפך ממי שהוא/היא באמת, עם פרטים ספציפיים ומצחיקים.\nפורמט: {"quotes": ["quote1", "quote2", ...]}`
        : `Person: ${victimName}\nRead carefully and identify every unique trait, habit, and obsession:\n${trueTraits}\n\nGenerate 8 quotes that betray their identity. Format: {"quotes": ["quote1", "quote2", ...]}`;

      const quotesResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content: QUOTE_SYSTEM_PROMPT(8, hebrewInstruction),
          },
          {
            role: 'user',
            content: userMessage,
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
      temperature: 0.9,
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