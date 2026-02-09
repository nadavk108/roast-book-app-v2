import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  console.log('[AUTH CALLBACK] Code present:', !!code);

  if (code) {
    // Return HTML page that handles session on client side
    // This is more reliable than server-side cookie handling
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Completing sign in...</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #FFFDF5;
            }
            .container {
              text-align: center;
            }
            .spinner {
              width: 48px;
              height: 48px;
              border: 4px solid #fbbf24;
              border-top-color: transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            h1 {
              font-size: 24px;
              font-weight: 700;
              margin: 0;
            }
            p {
              color: #666;
              margin: 8px 0 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>Completing sign in...</h1>
            <p>Please wait</p>
          </div>
          <script type="module">
            import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

            const supabase = createClient(
              '${process.env.NEXT_PUBLIC_SUPABASE_URL}',
              '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}'
            );

            async function completeAuth() {
              try {
                console.log('[AUTH] Exchanging code for session...');
                const { data, error } = await supabase.auth.exchangeCodeForSession('${code}');

                if (error) {
                  console.error('[AUTH] Error:', error);
                  window.location.href = '/login?error=auth_failed';
                  return;
                }

                console.log('[AUTH] Session established:', data.user.email);
                console.log('[AUTH] Redirecting to: ${next}');
                window.location.href = '${next}';
              } catch (err) {
                console.error('[AUTH] Exception:', err);
                window.location.href = '/login?error=auth_failed';
              }
            }

            completeAuth();
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }

  console.error('[AUTH CALLBACK] No code provided');
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
}
