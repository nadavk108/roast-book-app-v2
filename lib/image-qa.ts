/**
 * Image QA — evaluates generated images before upload
 * Uses Gemini 2.5 Flash to score face similarity and scene coherence
 * Called after each generateRoastImage(), before storage upload
 */

export interface QAResult {
  passed: boolean;
  faceSimilarityScore: number;
  sceneCoherenceScore: number;
  reasoning: string;
}

/**
 * Evaluate a generated image against the reference photo and the corresponding quote.
 * Returns passed=true on any evaluation error so QA never blocks generation.
 */
export async function evaluateImage(params: {
  generatedImageBase64: string;
  referenceImageBase64: string;
  quote: string;
  visualPrompt: string;
  imageIndex?: number;
  isRetry?: boolean;
}): Promise<QAResult> {
  const {
    generatedImageBase64,
    referenceImageBase64,
    quote,
    imageIndex = 0,
    isRetry = false,
  } = params;

  try {
    console.log(`[QA] Starting evaluation for image ${imageIndex}`);

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const evalPrompt = `You are an image quality evaluator for a comedy gift product.
You will receive two images:
- Image A (first image): The generated comedy scene to evaluate
- Image B (second image): The reference photo of the real person

Evaluate the following TWO criteria only:

1. FACE SIMILARITY (1-10): Does the person in Image A visually resemble the person in Image B?
   Consider: hair color/style, face shape, skin tone, build, age appearance.
   6+ means recognizably similar - a friend would recognize them.
   1-5 means they look like a different person entirely.

2. SCENE COHERENCE (1-10): Does the scene in Image A match the meaning of this quote: "${quote}"
   The image should depict a scenario related to the quote's theme or meaning.
   6+ means the scene makes sense for the quote.
   1-5 means the scene is unrelated to the quote.

Respond ONLY with valid JSON, no markdown, no explanation outside the JSON:
{"faceSimilarityScore": <number 1-10>, "sceneCoherenceScore": <number 1-10>, "reasoning": "<one sentence explanation>"}`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: evalPrompt },
            { text: 'Image A (generated scene):' },
            { inlineData: { mimeType: 'image/jpeg', data: generatedImageBase64 } },
            { text: 'Image B (reference photo):' },
            { inlineData: { mimeType: 'image/jpeg', data: referenceImageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    });

    const responseText = result.response.text().trim();

    let parsed: { faceSimilarityScore: number; sceneCoherenceScore: number; reasoning: string };
    try {
      // Strip markdown code blocks if present
      const jsonText = responseText
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error(`Failed to parse QA response as JSON: ${responseText}`);
    }

    const { faceSimilarityScore, sceneCoherenceScore, reasoning } = parsed;
    const passed = faceSimilarityScore >= 6 && sceneCoherenceScore >= 6;

    if (isRetry) {
      console.log(
        `[QA] Image ${imageIndex} retry — face: ${faceSimilarityScore}/10, scene: ${sceneCoherenceScore}/10 — ${passed ? 'PASS' : 'FAIL'} (accepting regardless)`
      );
    } else {
      console.log(
        `[QA] Image ${imageIndex} — face: ${faceSimilarityScore}/10, scene: ${sceneCoherenceScore}/10 — ${passed ? 'PASS' : 'FAIL'}`
      );
    }

    return { passed, faceSimilarityScore, sceneCoherenceScore, reasoning };
  } catch (error: any) {
    console.log(`[QA] Error during evaluation, skipping QA: ${error.message}`);
    return {
      passed: true,
      faceSimilarityScore: 0,
      sceneCoherenceScore: 0,
      reasoning: `QA skipped due to error: ${error.message}`,
    };
  }
}

/**
 * Extract base64 from a generateRoastImage() return value.
 * Handles both data URIs (Nano Banana Pro / Imagen) and HTTP URLs (DALL-E 3 fallback).
 */
export async function extractBase64FromImageResult(imageResult: string): Promise<string> {
  if (imageResult.startsWith('data:')) {
    const matches = imageResult.match(/^data:[^;]+;base64,(.+)$/);
    if (!matches) throw new Error('Invalid data URI format');
    return matches[1];
  }
  // HTTP URL (DALL-E 3 fallback) — fetch and convert
  return fetchImageAsBase64(imageResult);
}

/**
 * Fetch an image from a URL and return its base64 representation.
 * Used to load the victim reference photo once before image generation.
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}
