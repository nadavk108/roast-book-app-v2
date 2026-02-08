import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type QuoteGenerationInput = {
  victimName: string;
  trueTraits: string;
  language?: 'en' | 'he';
};

/**
 * Generate ironic "would never say" quotes using Claude
 * Uses the improved prompt with contextual irony framework
 */
export async function generateRoastQuotes(input: QuoteGenerationInput): Promise<string[]> {
  const { victimName, trueTraits, language = 'en' } = input;
  
  // Detect language if not specified
  const detectedLanguage = language === 'he' || /[\u0590-\u05FF]/.test(trueTraits) ? 'he' : 'en';
  
  const systemPrompt = `You are a Satirical Quote Generator. The user provides TRUE traits about someone. You generate ironic "Things they would NEVER say" that expose the comedic gap between their statement and their reality.

HUMOR FRAMEWORK:
- Identify the persona archetype (Foodie Snob, Urban Princess, Label Queen, Fitness Guru, Tech Bro, etc.)
- Create quotes that contradict their lifestyle/values
- Make them sharp and funny, not gentle
- The irony should be OBVIOUS and VISUAL

LANGUAGE RULE:
- If the input traits are in Hebrew, respond in Hebrew
- If in English, respond in English
- Match the user's language exactly

OUTPUT FORMAT - CRITICAL:
You MUST return ONLY a valid JSON array with exactly 8 strings. Nothing else. No markdown, no explanation, no code blocks.
Format: ["quote1", "quote2", "quote3", "quote4", "quote5", "quote6", "quote7", "quote8"]

EXAMPLES:
Input: "Loves designer bags, only shops at high-end stores, drives a luxury car"
Output: ["I'm going to start shopping at thrift stores", "Who needs brand names anyway?", "I love a good bargain bin", "Fast fashion is totally my vibe", "I'll just get the knockoff version", "Walmart has the best quality", "I don't care about labels at all", "Generic brands are just as good"]

Input: "אוהב קפה specialty, רק שותה ב-Third Wave, יש לו מכונת אספרסו בבית"
Output: ["אני אשתה נס קפה מהמכולת", "טורקי זה הכי טעים", "קפה זה קפה, מה הבעיה", "למה לשלם 18 שקל על אמריקנו", "בקפה נמס יש משהו מיוחד", "קפה של אלנבי זה הכי טוב", "אני לא מבין את כל העניין של קפה", "נס קפה עם מים רותחים זה מושלם"]`;

  const userPrompt = `The person's name is ${victimName}. Here are things they actually do/love: ${trueTraits}

Generate 8 opposite quotes in ${detectedLanguage === 'he' ? 'Hebrew' : 'English'}.

Remember: Return ONLY the JSON array. No other text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.9,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedText = content.text.trim();
    
    // Remove markdown code blocks
    cleanedText = cleanedText.replace(/```json\n?/g, '');
    cleanedText = cleanedText.replace(/```\n?/g, '');
    cleanedText = cleanedText.trim();

    // Parse the JSON array from Claude's response
    const quotes = JSON.parse(cleanedText);
    
    if (!Array.isArray(quotes)) {
      throw new Error('Response is not an array');
    }

    if (quotes.length !== 8) {
      console.warn(`Expected 8 quotes, got ${quotes.length}. Padding or truncating...`);
      
      // If we got fewer than 8, pad with generic quotes
      while (quotes.length < 8) {
        quotes.push(detectedLanguage === 'he' 
          ? `זה ממש לא מעניין אותי` 
          : `I don't care about that at all`);
      }
      
      // If we got more than 8, take only first 8
      return quotes.slice(0, 8);
    }

    return quotes;
  } catch (error) {
    console.error('Failed to parse quotes from Claude:', error);
    
    // Fallback: return generic quotes
    if (detectedLanguage === 'he') {
      return [
        `${victimName} אף פעם לא אומר דברים כאלה`,
        'זה ממש לא מעניין אותי',
        'אני לא מבין את כל הרעש סביב זה',
        'למה להתעסק עם זה בכלל',
        'יש דברים יותר חשובים בחיים',
        'אני ממש לא צריך את זה',
        'זה לא בשבילי',
        'תמיד העדפתי משהו אחר'
      ];
    } else {
      return [
        `I never say things like that`,
        'That doesn\'t interest me at all',
        'I don\'t understand what the fuss is about',
        'Why bother with that anyway',
        'There are more important things in life',
        'I really don\'t need that',
        'That\'s not for me',
        'I always preferred something else'
      ];
    }
  }
}