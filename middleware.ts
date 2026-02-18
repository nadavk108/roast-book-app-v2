import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // DIAGNOSTIC: Log middleware execution
  console.log('═══════════════════════════════════════════════');
  console.log('[MIDDLEWARE] 🔍 DIAGNOSTIC LOGS');
  console.log('[MIDDLEWARE] Path:', request.nextUrl.pathname);
  console.log('[MIDDLEWARE] Full URL:', request.url);
  console.log('[MIDDLEWARE] Has session:', !!session);
  if (session) {
    console.log('[MIDDLEWARE] Session user:', session.user?.email);
    console.log('[MIDDLEWARE] Session expires:', new Date(session.expires_at! * 1000).toISOString());
  }
  console.log('[MIDDLEWARE] Cookies:', request.cookies.getAll().map(c => c.name).join(', '));
  console.log('═══════════════════════════════════════════════');

  // Protected routes that require authentication
  // Note: /book and /preview are NOT protected - publicly shareable
  // Preview page has built-in paywall for unpaid books and auto-redirects complete books to /book/[slug]
  const protectedPaths = ['/create', '/dashboard'];
  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    console.log('[MIDDLEWARE] 🚫 No session, redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  // If already logged in and trying to access login page, redirect to dashboard
  if (request.nextUrl.pathname === '/login' && session) {
    console.log('[MIDDLEWARE] ✅ Has session at /login, redirecting to /dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  console.log('[MIDDLEWARE] ✅ Allowing request through');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     * - auth routes (auth callback must handle cookies independently)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/|auth/).*)',
  ],
};
