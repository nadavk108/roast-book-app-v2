import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type QuoteGenerationInput = {
  victimName: string;
  trueTraits: string;
  language?: 'en' | 'he';
};

export async function generateRoastQuotes(input: QuoteGenerationInput): Promise<string[]> {
  const { victimName, trueTraits, language } = input;

  const detectedLanguage =
    language === 'he' || /[\u0590-\u05FF]/.test(trueTraits) ? 'he' : 'en';

  const systemPrompt = `
You are a Satirical Quote Generator for a social roasting product.

The user provides TRUE traits about a real person.
Your job is to generate ironic quotes titled "Things they would never say".

These quotes must feel:
- Subtle
- Socially embarrassing
- Instantly recognizable as wrong for this person by their friends
- Directly and ONLY tied to the traits the user provided
- Funny because they betray the person's real habits, values, or lifestyle

ABSOLUTE CONSTRAINTS:
- Do NOT invent new traits
- Do NOT reference anything not explicitly stated in the input
- Do NOT hallucinate hobbies, professions, or behaviors
- Every quote must map clearly to at least one provided trait
- If the trait is vague, keep the quote vague
- If the trait is specific, the quote must be specific

HUMOR MECHANIC:
Do NOT use direct negations ("I hate X", "I don't do X").
Instead, write quotes that imply the person has become:
- boring
- square
- out of touch
- overly wholesome
- or strangely opposite in values

STYLE RULES:
- Each quote must sound like a real sentence someone could casually say
- No sarcasm markers, no emojis, no internet slang
- Short, punchy, natural speech
- No more than 12 words per quote
- No swearing
- No cruelty
- No exaggeration that breaks realism

LANGUAGE RULE:
- If the input traits are in Hebrew, output in Hebrew
- If the input traits are in English, output in English
- Match language perfectly

OUTPUT FORMAT - STRICT:
Return ONLY a valid JSON array of exactly 8 strings.
No markdown.
No explanation.
No surrounding text.
`;

  const userPrompt = `
The person's name is ${victimName}.
Here are things they actually do or love:
${trueTraits}

Generate 8 quotes in ${detectedLanguage === 'he' ? 'Hebrew' : 'English'}.
Return ONLY the JSON array.
`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      temperature: 0.85,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = message.content.find(c => c.type === 'text');
    if (!content) throw new Error('No text response from Claude');

    let cleanedText = content.text.trim();

    cleanedText = cleanedText.replace(/```json/g, '');
    cleanedText = cleanedText.replace(/```/g, '').trim();

    const quotes = JSON.parse(cleanedText);

    if (!Array.isArray(quotes)) {
      throw new Error('Claude did not return an array');
    }

    if (quotes.length !== 8) {
      throw new Error(`Expected 8 quotes, got ${quotes.length}`);
    }

    return quotes;
  } catch (error) {
    console.error('Roast quote generation failed:', error);

    if (detectedLanguage === 'he') {
      return [
        "אני פתאום בעניין של שגרה רגועה",
        "ערבים שקטים בבית זה הקטע שלי",
        "אני לוקח הפסקה מכל ההרגלים שלי",
        "אני מנסה אורח חיים רגוע יותר",
        "בא לי להוריד הילוך לאחרונה",
        "פחות רעש, יותר שקט",
        "אני בתקופה יותר מאופקת",
        "נראה לי ששיניתי כיוון לאחרונה"
      ];
    }

    return [
      "I'm suddenly into a quieter routine",
      "Staying in feels right lately",
      "Taking a break from my usual habits",
      "Trying a calmer lifestyle these days",
      "I've been slowing things down",
      "Less noise, more calm",
      "I'm in a more reserved phase",
      "Feels like I'm changing pace lately"
    ];
  }
}