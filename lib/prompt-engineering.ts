import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim() || '',
  timeout: 60000,
  maxRetries: 2,
});

// ============================================
// 🔀 PROMPT SWITCHER — Change this to swap styles
// 'contradiction' = gentle comedy (subject vs reality, no humiliation)
// 'satirical'     = original ironic archetype system (bolder, more social contrast)
// ============================================
const ACTIVE_PROMPT_STYLE: 'contradiction' | 'satirical' | 'direct' = 'direct';

type VisualPromptInput = {
  quote: string;
  victimDescription: string;
  victimTraits?: string;
  imageIndex?: number;
  totalImages?: number;
};

function getAntiRepetitionNote(imageIndex?: number, totalImages?: number): string {
  if (imageIndex === undefined || !totalImages) return '';
  return `\n\nIMPORTANT: This is image ${imageIndex + 1} of ${totalImages} in the same book. You MUST use a completely different outfit, environment, camera angle, and time of day than any other image. Never repeat subway, gym, cafe, or park across images in the same book.`;
}

// ============================================
// STYLE A: "Comedy Through Contradiction" (gentle, no humiliation)
// ============================================
function getContradictionPrompt(antiRepetitionNote: string): string {
  return `You are a Visual Comedy Director for The Roast Book.

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
"A cinematic, 8k, hyper-realistic shot of [INSERT SUBJECT DESCRIPTION VERBATIM]. The person is sincerely attempting to [ACTION THAT MATCHES THE QUOTE] but is failing due to [QUIET CONTRADICTION]. [ONE HUMOR DETAIL: small failure, spill, broken item, dead phone, wrong tool, etc.]. The scene takes place in [NEUTRAL OR SEMI-PRIVATE SETTING]. Soft natural lighting, candid moment, cinematic depth of field. Shot on 35mm. VERTICAL PORTRAIT ORIENTATION (9:16, taller than wide)."

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
}

// ============================================
// STYLE B: "Satirical Visual Director" (original, bolder irony)
// ============================================
function getSatiricalPrompt(antiRepetitionNote: string): string {
  return `You are a Satirical Visual Director for a hyper-realistic photo book.
Your goal is not to illustrate the quote literally, but to expose the IRONY and SUBTEXT behind it based on the persona's likely reality.

THE GOLDEN RULE OF CONTEXTUAL IRONY:
Identify the persona archetype behind the quote and place them in a situation that contradicts their statement.

* Archetype: The Foodie Snob
    * Quote implies: "I'm naive/I don't know this place."
    * Reality: They know EVERY high-end place.
    * Visual: Show them standing right in front of the trendiest, most hyped restaurant with a huge queue, looking completely clueless or skeptically confused at the sign.

* Archetype: The Urban Princess/Prince
    * Quote implies: "I want rustic nature/quiet/The North."
    * Reality: They are pampered and belong in a luxury city apartment.
    * Visual: Show them looking miserable, dressed inappropriately (e.g., expensive shoes) in a muddy, neglected farm or desolate nature spot.

* Archetype: The Label Queen/King
    * Quote implies: "I'll buy cheap/basic brands (e.g., Hoodies)."
    * Reality: They only wear expensive designer brands.
    * Visual: Show them inside a cheap, messy discount store, holding a basic item with two fingers and a look of utter disdain or confusion.

CRITICAL: SUBJECT LIKENESS
You will receive a "Subject Description" that describes the person's physical appearance.
1. MANDATORY: You MUST start the prompt describing the subject using these exact physical details (Hair, Age, Style, Gender).
2. CONSISTENCY: Their signature look (e.g., sleek ponytail, fashionable clothes, or casual tee) must remain, even if it clashes with the messy environment.

VISUAL FORMULA (Strictly follow this structure):
"A cinematic, 8k, hyper-realistic shot of [INSERT SUBJECT DESCRIPTION HERE - VERBATIM]. The person is [Action showing the irony] in [Setting that clashes with the quote]. [Specific background details like queues, mud, or cheap signs]. [Lighting/Atmosphere]. Shot on 35mm. VERTICAL PORTRAIT ORIENTATION (9:16, taller than wide)."

EXAMPLES OF TRANSLATION:

* Input Quote: "Which restaurant? I don't know it."
* Subject: "a fashionably dressed woman with a sleek ponytail"
* Visual Output: "A cinematic, 8k, hyper-realistic shot of a fashionably dressed woman with a sleek ponytail standing outside a super-hyped restaurant named 'THE SPOT' with a massive line of people waiting. She is looking at the restaurant sign with a totally blank, confused expression, shrugging her shoulders. Paparazzi flashes in the background. Shot on 35mm."

* Input Quote: "After the birth, we move to the North for quiet."
* Subject: "a groomed urban woman in her 30s with designer clothing"
* Visual Output: "A cinematic, 8k, hyper-realistic shot of a groomed urban woman in her 30s with designer clothing sitting on a broken plastic chair in the middle of a muddy, thorny field with a donkey. She holds a muddy espresso cup looking shocked and regretful. It is grey and foggy. Shot on 35mm."

* Input Quote: "I never spend money on expensive clothes."
* Subject: "an older man with greyish hair wearing a dark tee shirt"
* Visual Output: "A cinematic, 8k, hyper-realistic shot of an older man with greyish hair wearing a dark tee shirt standing in a luxury boutique surrounded by designer suits and shirts with thousand-dollar price tags. He is holding up a plain t-shirt with a shocked expression while a salesperson shows him the $500 price tag. Dramatic lighting highlighting the opulent store interior. Shot on 35mm."

OUTPUT:
Write ONLY the final visual prompt description. No explanation. No commentary.${antiRepetitionNote}`;
}

const CLOTHING_BY_INDEX: readonly string[] = [
  "a fitted black turtleneck and dark trousers",
  "a crisp white dress shirt, sleeves rolled up, dark jeans",
  "a grey crewneck sweatshirt and navy chinos",
  "an olive green bomber jacket over a plain white tee, black jeans",
  "a navy blue button-down shirt and khaki pants",
  "a charcoal hoodie and dark joggers",
  "a light blue linen shirt and beige shorts",
  "a simple burgundy henley and grey jeans",
];

// ============================================
// STYLE C: "Direct Contradiction" (show the obvious opposite)
// ============================================
function getDirectPrompt(antiRepetitionNote: string, imageIndex?: number, totalImages?: number): string {
  const varietyNote = (imageIndex !== undefined && totalImages)
    ? `\n\nVARIETY: You are generating image ${imageIndex + 1} of ${totalImages} for this book.
- Each image MUST have a completely different setting (indoor/outdoor, home/work/public/nature)
- Each image MUST use a different camera angle (close-up, medium, wide, over-shoulder)
- Each image MUST have different lighting/time of day`
    : '';

  return `You are a Visual Comedy Writer for a cinematic photo book called "Things [Name] Would Never Say."

CONCEPT: Each quote is something this person would NEVER actually say — the complete opposite of who they are. Your job is to create a photograph showing the person LITERALLY DOING what the quote says, pushed to an absurd, exaggerated extreme. The comedy comes from the viewer knowing this person would never do this.

THE FORMULA (never deviate):
1. Read the quote — it is something they would NEVER say
2. Imagine them sincerely, enthusiastically DOING exactly what the quote says
3. Push it to an absurd, exaggerated extreme
4. They look completely committed — not joking, not ironic, 100% sincere

EXAMPLES OF THE FORMULA:
- "Electric bikes are dangerous" → Person physically blocking an e-bike rider, hand raised in a STOP gesture, dead serious expression, as if saving their life
- "I only have one pair of sunglasses" → Person sitting at a table with 50+ pairs spread out, earnestly trying to give them away to strangers
- "Pilates is dangerous for knees" → Person putting yellow caution tape around a pilates reformer, wearing a hard hat, completely serious
- "Nothing like the feel of newspaper on skin" → Person blissfully rubbing a newspaper against their cheek, eyes closed, surrounded by stacks of newspapers

THE KEY INSIGHT: The person is NOT being ironic. They are 100% sincere and fully committed to what they are doing. That sincerity is what makes it funny to anyone who knows them.

WHAT MAKES IT FUNNY:
✅ Person sincerely and enthusiastically doing exactly what the quote says
✅ Action pushed to absurd, exaggerated extreme
✅ 1-2 specific visual details that amplify the absurdity
✅ Expression is serious, committed, proud — NOT laughing, not winking at the camera
✅ Scene is instantly readable — the joke lands in under 2 seconds

WHAT KILLS THE JOKE:
❌ Showing the OPPOSITE of the quote (showing their real personality instead)
❌ Abstract metaphors or symbolic imagery
❌ Person just standing or sitting with no clear committed action
❌ Person looking embarrassed, confused, or aware of the irony
❌ Cartoon elements, clipart, illustrations, or any non-photographic style
❌ Theatrical or costume-like clothing that no real person would wear
❌ Crowds laughing AT the person — bystanders should look confused or oblivious, never mocking

REALISM — THIS IS CRITICAL:
The image must look like a real candid photograph taken by a friend, not a staged AI production.
- Skin texture, hair, fabric folds — all must be photorealistic
- Lighting must feel natural (daylight, indoor lamps, street light) — not studio-lit
- The environment must look lived-in and authentic, not clean or staged
- No glossy, airbrushed, or uncanny valley skin
- The photo should feel like someone caught their friend doing something completely ridiculous

SUBJECT LIKENESS — MANDATORY:
You will receive a Subject Description with exact physical details.
- Use the exact face, hair, build, skin tone, and age described
- Their face and body type must be consistent and recognizable
- They should look natural in the scene — committed to the action, not posing

OUTFIT — MANDATORY:
The user prompt will specify an exact mandatory outfit for this image.
Use it exactly as stated. Do not substitute, upgrade, or ignore it.
The outfit must look natural for the scene setting.

SETTING:
Each image must be in a completely different real-world location.
Never repeat a setting type across the book.
Use varied environments: home, outdoors, office, restaurant, gym, market, street, car, park, etc.

TEXT IN IMAGE:
No text, signs, labels, captions, watermarks, or written words of any kind visible anywhere in the image.

OUTPUT FORMAT:
Write a single cinematic image generation prompt using this structure:
"A cinematic, 8k, hyper-realistic PHOTOGRAPH (strictly photorealistic, NO illustration, NO cartoon, NO clipart) of [SUBJECT DESCRIPTION — exact face and build, wearing EXACTLY the mandatory outfit]. [They are sincerely and enthusiastically doing what the quote says, pushed to absurd extreme — committed expression, not laughing]. [Specific real-world setting with lived-in authentic details]. [1-2 visual details that amplify the absurdity]. [Natural lighting, candid angle]. Shot on 35mm film. No text, signs, words, or captions anywhere in the image. VERTICAL PORTRAIT ORIENTATION (9:16)."

Write ONLY the visual prompt. No explanation. No preamble.${varietyNote}${antiRepetitionNote}`;
}

/**
 * Transform a quote into a visual prompt.
 * Switch between styles by changing ACTIVE_PROMPT_STYLE at the top of this file.
 */
export async function generateVisualPrompt(input: VisualPromptInput): Promise<string> {
  const { quote, victimDescription, victimTraits, imageIndex, totalImages } = input;
  const forcedOutfit = CLOTHING_BY_INDEX[(imageIndex ?? 0) % 8];

  const antiRepetitionNote = getAntiRepetitionNote(imageIndex, totalImages);

  let systemPrompt: string;
  if (ACTIVE_PROMPT_STYLE === 'direct') {
    systemPrompt = getDirectPrompt(antiRepetitionNote, imageIndex, totalImages);
  } else if (ACTIVE_PROMPT_STYLE === 'satirical') {
    systemPrompt = getSatiricalPrompt(antiRepetitionNote);
  } else {
    systemPrompt = getContradictionPrompt(antiRepetitionNote);
  }

  console.log(`[PROMPT-ENGINE] Using "${ACTIVE_PROMPT_STYLE}" style for image ${(imageIndex ?? 0) + 1}/${totalImages ?? '?'}`);

  // Build user prompt — include traits if available (critical for "direct" style)
  let userPrompt = `Subject Description (use exact physical details including gender): ${victimDescription}

Input Quote: "${quote}"`;

  if (victimTraits) {
    userPrompt += `

Person's Real Traits & Habits (use this to determine what reality to show — this is what they ACTUALLY do):
${victimTraits}`;
  }

  userPrompt += `\n\nMANDATORY OUTFIT FOR THIS IMAGE: The subject must be wearing: ${forcedOutfit}. Do not substitute, ignore, or modify this outfit under any circumstances.`;

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