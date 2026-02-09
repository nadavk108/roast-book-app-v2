import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      console.log('[AUTH CALLBACK] ✅ Session established for:', data.user?.email);
      console.log('[AUTH CALLBACK] Redirecting to:', next);

      // CRITICAL: Use the response object that has cookies, don't create a new redirect
      const redirectResponse = NextResponse.redirect(`${origin}${next}`);

      // Copy all cookies from the response that was used by Supabase
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie);
      });

      return redirectResponse;
    }

    console.error('[AUTH CALLBACK] ❌ Failed to exchange code:', error?.message);
  }

  // Return the user to an error page with instructions
  console.error('[AUTH CALLBACK] ❌ No code provided or auth failed');
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
