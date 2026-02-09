'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Completing sign in...');
  const hasRun = useRef(false);

  /**
   * Wait for Supabase session cookie to be present in browser before redirecting
   * This prevents middleware race condition where redirect happens before cookie is committed
   */
  const waitForCookie = (destination: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log('[AUTH CALLBACK PAGE] 🍪 Waiting for session cookie to be committed...');
      setStatus('Finalizing login...');

      let attempts = 0;
      const maxAttempts = 20; // 20 attempts * 100ms = 2 seconds

      const checkCookie = setInterval(() => {
        attempts++;

        // Check if Supabase session cookie exists (usually starts with 'sb-')
        const cookies = document.cookie;
        const hasSupabaseCookie = cookies.includes('sb-') && cookies.includes('access-token');

        if (hasSupabaseCookie) {
          console.log('[AUTH CALLBACK PAGE] ✅ Session cookie confirmed in browser');
          console.log('[AUTH CALLBACK PAGE] 🔄 Safe to redirect after', attempts * 100, 'ms');
          clearInterval(checkCookie);
          resolve();
        } else if (attempts >= maxAttempts) {
          // Fallback: Cookie might be HttpOnly (not visible to JS), redirect anyway
          console.log('[AUTH CALLBACK PAGE] ⏱️  Timeout: Redirecting after 2s (cookie might be HttpOnly)');
          clearInterval(checkCookie);
          resolve();
        }
      }, 100); // Check every 100ms
    });
  };

  useEffect(() => {
    // Prevent duplicate runs in React Strict Mode
    if (hasRun.current) {
      console.log('[AUTH CALLBACK PAGE] ⏭️  Skipping duplicate run (React Strict Mode)');
      return;
    }
    hasRun.current = true;

    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/dashboard';
    const origin = window.location.origin;

    console.log('[AUTH CALLBACK PAGE] 🔵 Starting auth flow');
    console.log('[AUTH CALLBACK PAGE] Code present:', !!code);
    console.log('[AUTH CALLBACK PAGE] Next destination:', next);
    console.log('[AUTH CALLBACK PAGE] Origin:', origin);

    if (!code) {
      console.error('[AUTH CALLBACK PAGE] ❌ No code provided');
      window.location.href = `${origin}/login?error=no_code`;
      return;
    }

    const completeAuth = async () => {
      try {
        console.log('[AUTH CALLBACK PAGE] Creating Supabase client...');
        const supabase = createClient();

        console.log('[AUTH CALLBACK PAGE] 🔄 Exchanging code for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('[AUTH CALLBACK PAGE] ⚠️  Error exchanging code:', error.message);

          // SAFETY CHECK: Code might be already used (React Strict Mode double-run)
          // Check if session exists anyway before failing
          console.log('[AUTH CALLBACK PAGE] 🔍 Safety check: Checking for existing session...');
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData?.session) {
            console.log('[AUTH CALLBACK PAGE] ✅ Session exists! First run succeeded, ignoring error.');
            console.log('[AUTH CALLBACK PAGE] ✅ Session for:', sessionData.session.user?.email);

            // Wait for cookie to be committed before redirecting
            await waitForCookie(`${origin}${next}`);

            console.log('[AUTH CALLBACK PAGE] 🔄 Hard redirect to:', `${origin}${next}`);
            window.location.assign(`${origin}${next}`);
            return;
          }

          // Both exchange failed AND no session exists - real error
          console.error('[AUTH CALLBACK PAGE] ❌ No session found. Auth truly failed.');
          setError(error.message);
          setTimeout(() => {
            window.location.href = `${origin}/login?error=auth_failed`;
          }, 2000);
          return;
        }

        if (data?.session) {
          console.log('[AUTH CALLBACK PAGE] ✅ Session established for:', data.user?.email);

          // Wait for cookie to be committed before redirecting
          await waitForCookie(`${origin}${next}`);

          console.log('[AUTH CALLBACK PAGE] 🔄 Hard redirect to:', `${origin}${next}`);
          window.location.assign(`${origin}${next}`);
        } else {
          console.error('[AUTH CALLBACK PAGE] ❌ No session in response');
          setError('Failed to establish session');
          setTimeout(() => {
            window.location.href = `${origin}/login?error=no_session`;
          }, 2000);
        }
      } catch (err: any) {
        console.error('[AUTH CALLBACK PAGE] ❌ Exception:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => {
          window.location.href = `${origin}/login?error=exception`;
        }, 2000);
      }
    };

    completeAuth();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-4">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-12 h-12 border-4 border-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">✕</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2">{status}</h1>
            <p className="text-gray-600 text-sm">
              {status === 'Finalizing login...'
                ? 'Securing your session...'
                : 'Please wait a moment'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
