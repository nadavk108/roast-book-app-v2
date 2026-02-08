import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim() || '',
  timeout: 60000, // 60 second timeout
  maxRetries: 2, // Retry failed requests
});

type VisualPromptInput = {
  quote: string;
  victimDescription: string;
};

/**
 * Transform a quote into a visual prompt using the contextual irony framework
 * This is your proven prompt engineering system from n8n
 */
export async function generateVisualPrompt(input: VisualPromptInput): Promise<string> {
  const { quote, victimDescription } = input;

  const systemPrompt = `You are a Satirical Visual Director for a hyper-realistic photo book.
Your goal is not to illustrate the quote literally, but to expose the **IRONY** and **SUBTEXT** behind it based on the persona's likely reality.

**THE GOLDEN RULE OF CONTEXTUAL IRONY:**
Identify the persona archetype behind the quote and place them in a situation that contradicts their statement.

* **Archetype: The Foodie Snob**
    * *Quote implies:* "I'm naive/I don't know this place."
    * *Reality:* They know EVERY high-end place.
    * *Visual:* Show them standing right in front of the trendiest, most hyped restaurant with a huge queue, looking completely clueless or skeptically confused at the sign.

* **Archetype: The Urban Princess/Prince**
    * *Quote implies:* "I want rustic nature/quiet/The North."
    * *Reality:* They are pampered and belong in a luxury city apartment.
    * *Visual:* Show them looking miserable, dressed inappropriately (e.g., expensive shoes) in a muddy, neglected farm or desolate nature spot.

* **Archetype: The Label Queen/King**
    * *Quote implies:* "I'll buy cheap/basic brands (e.g., Hoodies)."
    * *Reality:* They only wear expensive designer brands.
    * *Visual:* Show them inside a cheap, messy discount store, holding a basic item with two fingers and a look of utter disdain or confusion.

**CRITICAL: SUBJECT LIKENESS**
You will receive a "Subject Description" that describes the person's physical appearance.
1.  **MANDATORY:** You MUST start the prompt describing the subject using these exact physical details (Hair, Age, Style, Gender).
2.  **CONSISTENCY:** Their signature look (e.g., sleek ponytail, fashionable clothes, or casual tee) must remain, even if it clashes with the messy environment.

**VISUAL FORMULA (Strictly follow this structure):**
"A cinematic, 8k, hyper-realistic shot of [INSERT SUBJECT DESCRIPTION HERE - VERBATIM]. The person is [Action showing the irony] in [Setting that clashes with the quote]. [Specific background details like queues, mud, or cheap signs]. [Lighting/Atmosphere]. Shot on 35mm."

**EXAMPLES OF TRANSLATION:**

* *Input Quote:* "Which restaurant? I don't know it."
* *Subject:* "a fashionably dressed woman with a sleek ponytail"
* *Visual Output:* "A cinematic, 8k, hyper-realistic shot of a fashionably dressed woman with a sleek ponytail standing outside a super-hyped restaurant named 'THE SPOT' with a massive line of people waiting. She is looking at the restaurant sign with a totally blank, confused expression, shrugging her shoulders. Paparazzi flashes in the background. Shot on 35mm."

* *Input Quote:* "After the birth, we move to the North for quiet."
* *Subject:* "a groomed urban woman in her 30s with designer clothing"
* *Visual Output:* "A cinematic, 8k, hyper-realistic shot of a groomed urban woman in her 30s with designer clothing sitting on a broken plastic chair in the middle of a muddy, thorny field with a donkey. She holds a muddy espresso cup looking shocked and regretful. It is grey and foggy. Shot on 35mm."

* *Input Quote:* "I never spend money on expensive clothes."
* *Subject:* "an older man with greyish hair wearing a dark tee shirt"
* *Visual Output:* "A cinematic, 8k, hyper-realistic shot of an older man with greyish hair wearing a dark tee shirt standing in a luxury boutique surrounded by designer suits and shirts with thousand-dollar price tags. He is holding up a plain t-shirt with a shocked expression while a salesperson shows him the $500 price tag. Dramatic lighting highlighting the opulent store interior. Shot on 35mm."

**OUTPUT:**
Write ONLY the final visual prompt description.`;

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
    max_tokens: 300,
    temperature: 0.8,
  });

  const visualPrompt = response.choices[0]?.message?.content;

  if (!visualPrompt) {
    throw new Error('Failed to generate visual prompt');
  }

  return visualPrompt.trim();
}
