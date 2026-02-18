import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { generateVideoFunction } from '@/lib/inngest/functions/generate-video';

export const maxDuration = 300; // Give each step up to 5 minutes on Vercel Pro

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateVideoFunction],
});
