'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Completing sign in...');
  const hasRun = useRef(false);

  const waitForCookie = (destination: string): Promise<void> => {
    return new Promise((resolve) => {
      setStatus('Finalizing login...');
      let attempts = 0;
      const maxAttempts = 20;

      const checkCookie = setInterval(() => {
        attempts++;
        const cookies = document.cookie;
        const hasSupabaseCookie = cookies.includes('sb-') && cookies.includes('access-token');

        if (hasSupabaseCookie || attempts >= maxAttempts) {
          clearInterval(checkCookie);
          resolve();
        }
      }, 100);
    });
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get('code');
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') || '/dashboard';
    const origin = window.location.origin;

    console.log('[AUTH CALLBACK] URL:', window.location.href);
    console.log('[AUTH CALLBACK] code:', code, 'token_hash:', !!tokenHash, 'type:', type);

    const completeAuth = async () => {
      try {
        const supabase = createClient();

        // === FLOW 1: Email verification (token_hash + type) ===
        if (tokenHash && type) {
          console.log('[AUTH CALLBACK] Email verification flow, type:', type);
          setStatus('Verifying your email...');

          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });

          if (verifyError) {
            console.error('[AUTH CALLBACK] Verify error:', verifyError.message);

            // Check if already verified (link clicked twice)
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              console.log('[AUTH CALLBACK] Already verified, session exists');
              setStatus('Email verified! Redirecting...');
              await waitForCookie(`${origin}${next}`);
              window.location.assign(`${origin}${next}`);
              return;
            }

            setError(verifyError.message);
            setStatus('Verification failed');
            setTimeout(() => {
              window.location.href = `${origin}/login?error=verification_failed&message=${encodeURIComponent(verifyError.message)}`;
            }, 2000);
            return;
          }

          if (data?.session) {
            console.log('[AUTH CALLBACK] Email verified for:', data.session.user?.email);
            setStatus('Email verified! Redirecting...');
            await waitForCookie(`${origin}${next}`);
            window.location.assign(`${origin}${next}`);
          } else {
            // Verified but no session - user needs to sign in
            console.log('[AUTH CALLBACK] Verified but no session, redirect to login');
            setStatus('Email verified! Please sign in.');
            setTimeout(() => {
              window.location.href = `${origin}/login?verified=true`;
            }, 1500);
          }
          return;
        }

        // === FLOW 2: OAuth code exchange (Google) ===
        if (code) {
          console.log('[AUTH CALLBACK] OAuth code exchange flow');

          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[AUTH CALLBACK] Exchange error:', exchangeError.message);

            // Safety check: session might already exist
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              console.log('[AUTH CALLBACK] Session exists despite error');
              await waitForCookie(`${origin}${next}`);
              window.location.assign(`${origin}${next}`);
              return;
            }

            setError(exchangeError.message);
            setTimeout(() => {
              window.location.href = `${origin}/login?error=auth_failed`;
            }, 2000);
            return;
          }

          if (data?.session) {
            console.log('[AUTH CALLBACK] Session established for:', data.user?.email);
            await waitForCookie(`${origin}${next}`);
            window.location.assign(`${origin}${next}`);
          } else {
            setError('Failed to establish session');
            setTimeout(() => {
              window.location.href = `${origin}/login?error=no_session`;
            }, 2000);
          }
          return;
        }

        // === FLOW 3: No code or token - check URL hash (implicit flow) ===
        // Some Supabase configs use hash-based tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[AUTH CALLBACK] Hash-based token flow');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(sessionError.message);
            setTimeout(() => {
              window.location.href = `${origin}/login?error=session_failed`;
            }, 2000);
            return;
          }

          if (data?.session) {
            setStatus('Signed in! Redirecting...');
            await waitForCookie(`${origin}${next}`);
            window.location.assign(`${origin}${next}`);
            return;
          }
        }

        // Nothing worked
        console.error('[AUTH CALLBACK] No code, token_hash, or hash tokens found');
        window.location.href = `${origin}/login?error=no_code`;

      } catch (err: any) {
        console.error('[AUTH CALLBACK] Exception:', err);
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
            <p className="text-gray-600 text-sm">Please wait a moment</p>
          </>
        )}
      </div>
    </div>
  );
}