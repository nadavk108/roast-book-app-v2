import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Analyze victim photo to extract physical description
 * This is used to maintain consistency across generated images
 */
export async function analyzeVictimPhoto(imageUrl: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Describe the physical appearance of the person in this image for a fictional story. Focus on hair color, hairstyle, approximate age, gender, and clothing style. Do not identify who they are, just describe their look. Be specific and detailed.',
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const description = response.choices[0]?.message?.content;
  
  if (!description) {
    throw new Error('Failed to analyze victim photo');
  }

  return description.trim();
}
