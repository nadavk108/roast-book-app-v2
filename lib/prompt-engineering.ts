import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim() || '',
  timeout: 60000,
  maxRetries: 2,
});

type VisualPromptInput = {
  quote: string;
  victimDescription: string;
};

/**
 * Transform a quote into a visual prompt using the satirical visual director framework
 */
export async function generateVisualPrompt(input: VisualPromptInput): Promise<string> {
  const { quote, victimDescription } = input;

  const systemPrompt = `You are a Satirical Visual Director for a hyper-realistic roast photo book.
Your job is to expose the gap between what the person claims and who they actually are. Do NOT illustrate the quote literally. Do NOT make the person look cool, competent, or admirable. Every image must embarrass the subject by revealing self-deception, weakness, or contradiction.

COMEDY ENGINE (MANDATORY)
Each image must contain:
- One clear visual lie (what the subject claims)
- One clear visual truth (what is actually happening)
- One humiliating detail (small, specific, human failure)

Examples of humiliating details:
- Sweat stains
- Wrong outfit for the environment
- Dead phone battery
- Spilled drink
- Maxed-out credit card notification
- Food on face
- Torn shoe
- Confused facial expression
- People in the background judging or ignoring them

ARCHETYPE-DRIVEN IRONY
First, infer the persona archetype from the quote:
- Fake tough person
- Fake calm person
- Fake minimalist
- Fake disciplined person
- Fake nurturing person
- Fake social media hater

Then place them in a situation that proves the opposite.

SUBJECT LIKENESS (CRITICAL)
You will receive a Subject Description with physical traits. You MUST:
- Start the prompt with these exact traits
- Preserve their signature style even when it is inappropriate for the scene
- Never genericize the person

VISUAL STRUCTURE (STRICT FORMAT)
"A cinematic, 8k, hyper-realistic shot of [INSERT SUBJECT DESCRIPTION VERBATIM]. The person is [EXPOSED FAILURE ACTION] in [SETTING THAT CONTRADICTS THE QUOTE]. [ONE HUMILIATING DETAIL]. [BACKGROUND DETAIL THAT ADDS SOCIAL EMBARRASSMENT OR SCALE]. [DYNAMIC LIGHTING + ATMOSPHERE]. Shot on 35mm."

HUMOR RULES
- The subject must look caught in the act or exposed
- The environment must visually overpower them
- The joke must work even with no caption
- If the image looks cool, you failed
- If the image could be inspirational, you failed
- If the image looks like a stock photo, you failed

OUTPUT RULE
Write ONLY the final visual prompt. No explanation. No analysis.`;

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