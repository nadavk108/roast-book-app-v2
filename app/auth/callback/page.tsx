'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

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
            console.log('[AUTH CALLBACK PAGE] 🔄 Hard redirect to:', `${origin}${next}`);
            // CRITICAL: Use window.location.href to force full page reload
            // This ensures middleware receives fresh auth cookies
            window.location.href = `${origin}${next}`;
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
          console.log('[AUTH CALLBACK PAGE] 🔄 Hard redirect to:', `${origin}${next}`);
          // CRITICAL: Use window.location.href to force full page reload
          // This ensures middleware receives fresh auth cookies
          window.location.href = `${origin}${next}`;
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
            <h1 className="text-2xl font-bold mb-2">Completing sign in...</h1>
            <p className="text-gray-600">Please wait a moment</p>
          </>
        )}
      </div>
    </div>
  );
}
