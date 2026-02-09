'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/dashboard';

    console.log('[AUTH CALLBACK PAGE] Starting auth flow');
    console.log('[AUTH CALLBACK PAGE] Code present:', !!code);
    console.log('[AUTH CALLBACK PAGE] Next destination:', next);

    if (!code) {
      console.error('[AUTH CALLBACK PAGE] No code provided');
      router.push('/login?error=no_code');
      return;
    }

    const completeAuth = async () => {
      try {
        console.log('[AUTH CALLBACK PAGE] Creating Supabase client...');
        const supabase = createClient();

        console.log('[AUTH CALLBACK PAGE] Exchanging code for session...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('[AUTH CALLBACK PAGE] Error exchanging code:', error);
          setError(error.message);
          setTimeout(() => router.push('/login?error=auth_failed'), 2000);
          return;
        }

        if (data?.session) {
          console.log('[AUTH CALLBACK PAGE] ✅ Session established for:', data.user?.email);
          console.log('[AUTH CALLBACK PAGE] Redirecting to:', next);
          router.push(next);
        } else {
          console.error('[AUTH CALLBACK PAGE] No session in response');
          setError('Failed to establish session');
          setTimeout(() => router.push('/login?error=no_session'), 2000);
        }
      } catch (err: any) {
        console.error('[AUTH CALLBACK PAGE] Exception:', err);
        setError(err.message || 'Authentication failed');
        setTimeout(() => router.push('/login?error=exception'), 2000);
      }
    };

    completeAuth();
  }, [searchParams, router]);

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
