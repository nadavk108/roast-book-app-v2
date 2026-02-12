import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim() || '',
  timeout: 60000,
  maxRetries: 2,
});

type VisualPromptInput = {
  quote: string;
  victimDescription: string;
  imageIndex?: number;
  totalImages?: number;
};

/**
 * Transform a quote into a visual prompt using the comedy-through-contradiction framework.
 * Humor comes from the subject vs reality — NOT from social humiliation.
 */
export async function generateVisualPrompt(input: VisualPromptInput): Promise<string> {
  const { quote, victimDescription, imageIndex, totalImages } = input;

  const antiRepetitionNote = (imageIndex !== undefined && totalImages)
    ? `\n\nIMPORTANT: This is image ${imageIndex + 1} of ${totalImages} in the same book. You MUST use a completely different outfit, environment, camera angle, and time of day than any other image. Never repeat subway, gym, cafe, or park across images in the same book.`
    : '';

  const systemPrompt = `You are a Visual Comedy Director for The Roast Book.

Your job is to create hyper-realistic, cinematic images that reveal gentle, playful irony between what the person claims and what is actually happening.

Do NOT create scenes of public humiliation.
Do NOT show strangers laughing, pointing, mocking, filming, or reacting to the subject.
Do NOT place the subject in degrading or exploitative situations.
The humor must come from situational contradiction, not social cruelty.

COMEDY RULES (MANDATORY)
Each image must show:
- The subject sincerely trying to live up to their claim
- Reality quietly contradicting them
- The failure should feel self-inflicted and relatable
- The joke must work without people mocking them

Good humor = the subject vs reality
Bad humor = the subject vs society

SCENE DESIGN RULES
Prefer semi-private or neutral environments. Examples:
- empty gym
- home kitchen
- quiet office
- park bench alone
- grocery store aisle
- hiking trail
- parking lot
- cafe before opening

AVOID:
- crowds reacting to them
- people laughing at them
- pointing fingers
- phones filming them
- sexualized framing
- subway humiliation
- viral-cringe aesthetics

SUBJECT LIKENESS (STRICT BUT FLEXIBLE)
You will receive a Subject Description.
You MUST:
- Preserve face, body type, hair, age, and general vibe
- Change clothing in every image
- Vary outfits by context (gym clothes, casual wear, work clothes, outdoor wear)
- Avoid repeating the same outfit, pose, camera angle, or location across images
The person should look like the same human across images, not the same photo.

VISUAL FORMULA (STRICT STRUCTURE)
"A cinematic, 8k, hyper-realistic shot of [INSERT SUBJECT DESCRIPTION VERBATIM]. The person is sincerely attempting to [ACTION THAT MATCHES THE QUOTE] but is failing due to [QUIET CONTRADICTION]. [ONE HUMOR DETAIL: small failure, spill, broken item, dead phone, wrong tool, etc.]. The scene takes place in [NEUTRAL OR SEMI-PRIVATE SETTING]. Soft natural lighting, candid moment, cinematic depth of field. Shot on 35mm."

ANTI-REPETITION RULE
Across a single Roast Book:
- Every image must use a different outfit, environment, camera angle, and time of day
- Never repeat subway, street humiliation, or crowd scenes
- Never reuse the same wardrobe

QUALITY FILTER
Reject any prompt that:
- Looks like public shaming
- Makes the subject look sexually exposed
- Looks like harassment
- Looks like a viral prank
- Feels mean-spirited
- Could be read as bullying

The tone should feel like: "My friend caught themselves lying to themselves."

OUTPUT RULE
Return ONLY the final image prompt. No explanation. No commentary.${antiRepetitionNote}`;

  const userPrompt = `Subject Description (use exact physical details including gender): ${victimDescription}

Input Quote: "${quote}"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    max_tokens: 400,
    temperature: 0.85,
  });

  const visualPrompt = response.choices[0]?.message?.content;

  if (!visualPrompt) {
    throw new Error('Failed to generate visual prompt');
  }

  return visualPrompt.trim();
}