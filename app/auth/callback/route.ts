import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  console.log('[AUTH CALLBACK] 🔵 Started - URL:', requestUrl.toString());
  console.log('[AUTH CALLBACK] 🔵 Code present:', !!code);
  console.log('[AUTH CALLBACK] 🔵 Origin:', origin);
  console.log('[AUTH CALLBACK] 🔵 Next destination:', next);

  if (code) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    let cookiesSet: string[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = request.cookies.get(name)?.value;
            console.log('[AUTH CALLBACK] 🔍 Cookie GET:', name, value ? '(has value)' : '(empty)');
            return value;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log('[AUTH CALLBACK] 🍪 Cookie SET:', name, 'options:', JSON.stringify(options));
            cookiesSet.push(name);
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
            console.log('[AUTH CALLBACK] 🗑️  Cookie REMOVE:', name);
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

    console.log('[AUTH CALLBACK] 🔄 Exchanging code for session...');
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      console.log('[AUTH CALLBACK] ✅ Session established for:', data.user?.email);
      console.log('[AUTH CALLBACK] ✅ Session expires at:', new Date(data.session.expires_at! * 1000).toISOString());
      console.log('[AUTH CALLBACK] 🍪 Total cookies set during exchange:', cookiesSet.length, cookiesSet);

      const allCookies = response.cookies.getAll();
      console.log('[AUTH CALLBACK] 🍪 Cookies in response:', allCookies.length);
      allCookies.forEach(cookie => {
        console.log('[AUTH CALLBACK] 🍪   -', cookie.name, ':', cookie.value.substring(0, 20) + '...', 'options:', JSON.stringify({ domain: cookie.domain, path: cookie.path, secure: cookie.secure, httpOnly: cookie.httpOnly, sameSite: cookie.sameSite }));
      });

      console.log('[AUTH CALLBACK] ↪️  Creating redirect to:', `${origin}${next}`);

      // CRITICAL: Use the response object that has cookies, don't create a new redirect
      const redirectResponse = NextResponse.redirect(`${origin}${next}`);

      // Copy all cookies from the response that was used by Supabase
      allCookies.forEach(cookie => {
        redirectResponse.cookies.set(cookie);
        console.log('[AUTH CALLBACK] 📋 Copied cookie to redirect:', cookie.name);
      });

      console.log('[AUTH CALLBACK] ✅ Returning redirect response with', redirectResponse.cookies.getAll().length, 'cookies');
      return redirectResponse;
    }

    console.error('[AUTH CALLBACK] ❌ Failed to exchange code:', error?.message);
    console.error('[AUTH CALLBACK] ❌ Error details:', JSON.stringify(error, null, 2));
  }

  // Return the user to an error page with instructions
  console.error('[AUTH CALLBACK] ❌ No code provided or auth failed');
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
