import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique slug for a roast book
 */
export function generateBookSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 10; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImageToStorage(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const { supabaseAdmin } = await import('./supabase');
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Download image from URL (or convert base64) and upload to Supabase with retry logic
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  bucket: string,
  path: string
): Promise<string> {
  const { withRetry } = await import('./retry');
  const { supabaseAdmin } = await import('./supabase');

  // Step 1: Get image blob (handle both HTTP URLs and base64 data URLs)
  const blob = await withRetry(
    async () => {
      // Check if it's a base64 data URL (from Imagen)
      if (imageUrl.startsWith('data:')) {
        console.log(`[${path}] Converting base64 image to blob`);

        // Extract base64 data and mime type
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid base64 data URL format');
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // Convert base64 to blob
        const binaryString = Buffer.from(base64Data, 'base64');
        return new Blob([binaryString], { type: mimeType });
      }

      // Otherwise, fetch from HTTP URL
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      return await response.blob();
    },
    {
      maxAttempts: 3,
      initialDelayMs: 2000,
      onRetry: (error, attempt) => {
        console.log(`[${path}] Download/conversion retry ${attempt}/3: ${error.message}`);
      },
    }
  );

  console.log(`[${path}] Image ready, size: ${blob.size} bytes`);

  // Step 2: Upload to Supabase with retry
  const uploadResult = await withRetry(
    async () => {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, blob, {
          contentType: blob.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error(`[${path}] Supabase upload error:`, error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      return data;
    },
    {
      maxAttempts: 3,
      initialDelayMs: 2000,
      onRetry: (error, attempt) => {
        console.log(`[${path}] Upload retry ${attempt}/3: ${error.message}`);
      },
    }
  );

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(uploadResult.path);

  console.log(`[${path}] ✅ Upload complete: ${urlData.publicUrl}`);

  return urlData.publicUrl;
}

/**
 * Format price in dollars
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Detect if text is Hebrew
 */
export function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}