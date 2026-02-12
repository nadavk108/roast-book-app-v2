/**
 * Image Generation with Gemini 3 Pro Image (Nano Banana Pro)
 * This is Google's advanced image generation model with professional-grade output
 */

export type ImageGenerationConfig = {
  prompt: string;
  victimImageUrl?: string;
};

export type ImageProvider = 'dall-e-3' | 'nano-banana-pro' | 'google-imagen-4' | 'google-imagen-3';

// Using Gemini Nano Banana Pro for image editing with victim reference
const ACTIVE_PROVIDER: ImageProvider = 'nano-banana-pro';

/**
 * Generate a roast image using the active provider
 */
export async function generateRoastImage(config: ImageGenerationConfig): Promise<string> {
  switch (ACTIVE_PROVIDER) {
    case 'dall-e-3':
      return generateWithDallE3(config);
    case 'nano-banana-pro':
      return generateWithNanoBananaPro(config);
    case 'google-imagen-4':
      return generateWithImagen4(config);
    case 'google-imagen-3':
      return generateWithImagen3(config);
    default:
      throw new Error(`Unknown provider: ${ACTIVE_PROVIDER}`);
  }
}

/**
 * Generate image using OpenAI DALL-E 3
 * Works excellently with detailed text descriptions
 */
async function generateWithDallE3(config: ImageGenerationConfig): Promise<string> {
  const { default: OpenAI } = await import('openai');
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const openai = new OpenAI({
      apiKey,
      timeout: 60000, // 60 second timeout
      maxRetries: 2,
    });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: config.prompt,
      n: 1,
      size: '1024x1792', // Portrait 9:16 aspect ratio
      quality: 'hd',
      style: 'vivid', // More photorealistic
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      console.error('DALL-E 3 response:', JSON.stringify(response, null, 2));
      throw new Error('No image URL returned from DALL-E 3');
    }

    return imageUrl;

  } catch (error) {
    console.error('DALL-E 3 generation error:', error);
    throw error;
  }
}

/**
 * Generate image using Gemini 3 Pro Image (Nano Banana Pro)
 * CRITICAL: Uses IMAGE EDIT operation with victim image as base
 * This is the key to maintaining victim likeness - we EDIT their image, not generate from scratch
 */
async function generateWithNanoBananaPro(config: ImageGenerationConfig): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  console.log('[NANO-BANANA-PRO] Starting generation...');
  console.log('[NANO-BANANA-PRO] Has API key:', !!apiKey);
  console.log('[NANO-BANANA-PRO] Has victim image:', !!config.victimImageUrl);
  console.log('[NANO-BANANA-PRO] Victim image URL:', config.victimImageUrl?.substring(0, 100));

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  if (!config.victimImageUrl) {
    console.error('No victim image provided for Nano Banana Pro - this model requires a reference image');
    throw new Error('Nano Banana Pro requires victim image');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the exact model name from your n8n workflow
    console.log('[NANO-BANANA-PRO] Initializing model: gemini-3-pro-image-preview');
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview'
    });

    // Fetch and convert victim image to base64 with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let base64Image: string;
    try {
      const imageResponse = await fetch(config.victimImageUrl, {
        signal: controller.signal,
      });

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch victim image: ${imageResponse.status} ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString('base64');
      clearTimeout(timeoutId);

      console.log(`Successfully fetched and converted victim image (${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)}MB)`);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout fetching victim image from: ${config.victimImageUrl}`);
      }
      throw error;
    }

    // Build the image editing request
    // The key is to pass the victim image FIRST, then the edit instruction
    const parts = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
      {
          text: `Transform this person into a completely new scene. You MUST preserve their face, facial features, body type, hair color, and hairstyle — but EVERYTHING ELSE must change.

New scene description: ${config.prompt}

CRITICAL RULES:
- PRESERVE: face, facial features, body shape, hair color, hairstyle, skin tone, age
- MUST CHANGE: clothing, outfit, background, setting, pose, scenario. The person must be wearing DIFFERENT clothes than in this photo. This is mandatory.
- The person must be the central focus of the image
- OUTPUT MUST BE VERTICAL PORTRAIT ORIENTATION (taller than wide, 9:16 aspect ratio). Do NOT output landscape or square images.`
        },
    ];

    console.log('[NANO-BANANA-PRO] Calling generateContent...');
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: parts,
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 8192,
      },
    });

    console.log('[NANO-BANANA-PRO] Got response from model');
    const response = result.response;

    // Extract the edited image from response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart || !imagePart.inlineData) {
      console.error('Nano Banana Pro response:', JSON.stringify(response, null, 2));
      throw new Error('No image data in Nano Banana Pro response');
    }

    const editedBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    return `data:${mimeType};base64,${editedBase64}`;

  } catch (error: any) {
    console.error('[NANO-BANANA-PRO] ❌ FAILED with error:', error);
    console.error('[NANO-BANANA-PRO] Error name:', error?.name);
    console.error('[NANO-BANANA-PRO] Error message:', error?.message);
    console.error('[NANO-BANANA-PRO] Error code:', error?.code);
    console.error('[NANO-BANANA-PRO] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Fall back to DALL-E 3 if edit fails
    console.log('[NANO-BANANA-PRO] Falling back to DALL-E 3...');
    return generateWithDallE3(config);
  }
}

/**
 * Generate image using Google Imagen 4 via REST API
 * This is the latest version and works with API key authentication
 */
async function generateWithImagen4(config: ImageGenerationConfig): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: config.prompt,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '9:16',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen 4 API error:', response.status, errorText);

      // Fall back to Imagen 3
      if (response.status === 404 || response.status === 403) {
        console.log('Imagen 4 not available, trying Imagen 3...');
        return generateWithImagen3(config);
      }

      throw new Error(`Imagen 4 API failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Extract image from response
    const prediction = data.predictions?.[0];

    if (!prediction) {
      throw new Error('No predictions in Imagen 4 response');
    }

    const base64Image = prediction.bytesBase64Encoded || prediction.image || prediction.b64_json;
    const mimeType = prediction.mimeType || 'image/png';

    if (!base64Image) {
      console.error('Imagen 4 response format:', JSON.stringify(data, null, 2));
      throw new Error('No image data in Imagen 4 response');
    }

    return `data:${mimeType};base64,${base64Image}`;

  } catch (error) {
    console.error('Imagen 4 generation error:', error);
    throw error;
  }
}

/**
 * Generate image using Google Imagen 3 via REST API
 * Using the generativelanguage API with the GEMINI_API_KEY
 */
async function generateWithImagen3(config: ImageGenerationConfig): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    // Try using AI Studio's generateImage endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: config.prompt,
          numberOfImages: 1,
          aspectRatio: '9:16',
          safetyFilterLevel: 'block_few',
          personGeneration: 'allow_adult',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen 3 API error:', response.status, errorText);

      // Fall back to DALL-E 3 if Imagen not available
      if (response.status === 404 || response.status === 403 || response.status === 400) {
        console.log('Imagen 3 not available, falling back to DALL-E 3...');
        return generateWithDallE3(config);
      }

      throw new Error(`Imagen 3 API failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Extract image from response (newer API format)
    const generatedImage = data.generatedImages?.[0];

    if (!generatedImage) {
      console.error('Imagen response format:', JSON.stringify(data, null, 2));
      throw new Error('No generated images in Imagen response');
    }

    // Handle different possible response formats
    const base64Image = generatedImage.bytesBase64Encoded || generatedImage.image || generatedImage.imageData;
    const mimeType = generatedImage.mimeType || 'image/png';

    if (!base64Image) {
      console.error('Imagen image format:', JSON.stringify(generatedImage, null, 2));
      throw new Error('No image data in Imagen response');
    }

    return `data:${mimeType};base64,${base64Image}`;

  } catch (error) {
    console.error('Imagen 3 generation error:', error);
    // Fall back to DALL-E 3 as last resort
    console.log('Falling back to DALL-E 3 due to error...');
    return generateWithDallE3(config);
  }
}

/**
 * Alternative: Use Vertex AI SDK directly (UNUSED - requires GCP project setup)
 * If you want to use this, add GCP_PROJECT_ID to .env.local and uncomment
 */
// async function generateWithVertexAI(config: ImageGenerationConfig): Promise<string> {
//   const { VertexAI } = await import('@google-cloud/vertexai');
//   const projectId = process.env.GCP_PROJECT_ID;
//   const location = process.env.GCP_LOCATION || 'us-central1';
//   if (!projectId) {
//     throw new Error('GCP_PROJECT_ID not configured');
//   }
//   const vertexAI = new VertexAI({ project: projectId, location: location });
//   const generativeModel = vertexAI.preview.getGenerativeModel({ model: 'imagen-3.0-generate-001' });
//   const result = await generativeModel.generateContent({
//     contents: [{ role: 'user', parts: [{ text: config.prompt }] }],
//     generationConfig: { numberOfImages: 1, aspectRatio: '9:16', safetyFilterLevel: 'block_few', personGeneration: 'allow_adult' } as any,
//   });
//   const imagePart = result.response.candidates?.[0]?.content?.parts?.[0];
//   if (!imagePart || !('inlineData' in imagePart)) throw new Error('No image data');
//   const imageData = (imagePart as any).inlineData;
//   return `data:${imageData.mimeType || 'image/jpeg'};base64,${imageData.data}`;
// }

/**
 * Fallback to Imagen 2 if Imagen 3 fails
 */
async function generateWithImagen2(config: ImageGenerationConfig): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-2.0-generate-001:predict`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: config.prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '9:16',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Imagen 2 API failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const prediction = data.predictions?.[0];

  if (!prediction) {
    throw new Error('No predictions in Imagen 2 response');
  }

  const base64Image = prediction.bytesBase64Encoded || prediction.image;
  const mimeType = prediction.mimeType || 'image/png';

  if (!base64Image) {
    throw new Error('No image data in Imagen 2 response');
  }

  return `data:${mimeType};base64,${base64Image}`;
}

/**
 * Get estimated cost per image
 */
export function getImageGenerationCost(): number {
  switch (ACTIVE_PROVIDER) {
    case 'dall-e-3':
      return 0.08; // $0.08 per HD 1024x1792 image
    case 'nano-banana-pro':
      return 0.134;
    case 'google-imagen-4':
      return 0.05;
    case 'google-imagen-3':
      return 0.04;
    default:
      return 0.08;
  }
}

/**
 * Get estimated generation time in seconds
 */
export function getEstimatedGenerationTime(): number {
  switch (ACTIVE_PROVIDER) {
    case 'dall-e-3':
      return 12; // Fast and reliable
    case 'nano-banana-pro':
      return 18;
    case 'google-imagen-4':
      return 15;
    case 'google-imagen-3':
      return 15;
    default:
      return 12;
  }
}
