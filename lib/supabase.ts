import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export type Database = {
  public: {
    Tables: {
      roast_books: {
        Row: {
          id: string;
          created_at: string;
          victim_name: string;
          victim_image_url: string;
          victim_description: string;
          quotes: string[];
          custom_greeting: string | null;
          status: 'analyzing' | 'generating_prompts' | 'generating_images' | 'preview_ready' | 'paid' | 'complete' | 'failed';
          preview_image_urls: string[];
          full_image_urls: string[];
          cover_image_url: string | null;
          slug: string;
          stripe_session_id: string | null;
          stripe_payment_intent: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          victim_name: string;
          victim_image_url: string;
          victim_description?: string;
          quotes: string[];
          custom_greeting?: string | null;
          status?: 'analyzing' | 'generating_prompts' | 'generating_images' | 'preview_ready' | 'paid' | 'complete' | 'failed';
          preview_image_urls?: string[];
          full_image_urls?: string[];
          cover_image_url?: string | null;
          slug: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          victim_name?: string;
          victim_image_url?: string;
          victim_description?: string;
          quotes?: string[];
          custom_greeting?: string | null;
          status?: 'analyzing' | 'generating_prompts' | 'generating_images' | 'preview_ready' | 'paid' | 'complete' | 'failed';
          preview_image_urls?: string[];
          full_image_urls?: string[];
          cover_image_url?: string | null;
          slug?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
        };
      };
    };
  };
};
