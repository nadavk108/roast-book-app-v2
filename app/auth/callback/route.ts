import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  console.log('[AUTH CALLBACK] 🔵 Started - Code present:', !!code);

  if (code) {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log('[AUTH CALLBACK] 🍪 Setting cookie:', name);
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            console.log('[AUTH CALLBACK] 🗑️ Removing cookie:', name);
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    console.log('[AUTH CALLBACK] 🔄 Exchanging code for session...');
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      console.log('[AUTH CALLBACK] ✅ Session established for:', data.user?.email);
      console.log('[AUTH CALLBACK] ✅ Redirecting to:', `${origin}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[AUTH CALLBACK] ❌ Failed to exchange code:', error?.message);
  }

  console.error('[AUTH CALLBACK] ❌ No code or auth failed, redirecting to login');
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
