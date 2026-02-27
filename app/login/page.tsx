'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flame, Loader2, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, resetPassword } from '@/lib/auth';
import { BrutalButton } from '@/components/ui/brutal-button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debug logging
 useEffect(() => {
    const errorParam = searchParams.get('error');
    const redirectParam = searchParams.get('redirect');
    const verifiedParam = searchParams.get('verified');
    console.log('[LOGIN PAGE] 🔍 Mounted with params:', { error: errorParam, redirect: redirectParam, verified: verifiedParam });

    if (verifiedParam === 'true') {
      setSuccessMessage('Email verified! You can now sign in.');
    }

    if (errorParam) {
      console.log('[LOGIN PAGE] ❌ Error from URL params:', errorParam);
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Get redirect destination from URL params (set by middleware)
      const redirectParam = searchParams.get('redirect');
      console.log('[LOGIN] Redirect param from URL:', redirectParam);

      // Pass redirect destination to OAuth flow
      await signInWithGoogle(redirectParam || '/dashboard');
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await signInWithEmail(email, password);

      if (result.needsEmailVerification) {
          setSuccessMessage('Account created! Check your email to verify your account.');
          setEmailLoading(false);
        } else if (result.isNewUser) {
          setSuccessMessage('Account created successfully! Redirecting...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          // Existing user signed in - hard redirect to pick up session cookie
          window.location.href = '/dashboard';
        }
    } catch (err: any) {
      console.error('Email auth error:', err);

      // Better error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('Incorrect password. Please try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please verify your email before signing in.');
      } else if (err.message?.includes('Password should be at least 6 characters')) {
        setError('Password must be at least 6 characters.');
      } else if (err.message?.includes('Invalid email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
      setEmailLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await resetPassword(resetEmail);
      setSuccessMessage('Password reset email sent! Check your inbox.');
      setShowPasswordReset(false);
      setResetEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-card border-3 border-foreground rounded-2xl p-8 md:p-10 shadow-brutal">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-3 border-foreground bg-primary shadow-brutal">
              <Flame className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="font-heading text-2xl font-bold">The Roast Book</span>
          </Link>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-black mb-3">
              Sign in to Roast
            </h1>
            <p className="text-muted-foreground text-lg">
              Create hilarious AI-powered roast books for your friends
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
              <p className="text-green-700 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <BrutalButton
            onClick={handleGoogleSignIn}
            disabled={loading || emailLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-bold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </BrutalButton>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card font-heading font-bold">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-heading font-bold text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={emailLoading || loading}
                className="border-3 h-12 text-base"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-heading font-bold text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={emailLoading || loading}
                  className="border-3 h-12 text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={emailLoading || loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-xs font-medium underline hover:text-foreground transition-colors"
                  disabled={emailLoading || loading}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <BrutalButton
              type="submit"
              disabled={emailLoading || loading}
              className="w-full bg-accent hover:bg-accent/90 py-6 text-lg font-bold"
              size="lg"
            >
              {emailLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Please wait...
                </>
              ) : (
                'Continue'
              )}
            </BrutalButton>
          </form>

          {/* Info Message */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            New here? Enter your email and password to create an account automatically
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPasswordReset(false)}>
          <div className="bg-card border-3 border-foreground rounded-2xl p-8 max-w-md w-full shadow-brutal" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-2xl font-black mb-2">Reset Password</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="font-heading font-bold text-sm">
                  Email
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={resetLoading}
                  className="border-3 h-12 text-base"
                />
              </div>

              <div className="flex gap-3">
                <BrutalButton
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  disabled={resetLoading}
                  className="flex-1 bg-muted hover:bg-muted/80 py-3"
                  variant="outline"
                >
                  Cancel
                </BrutalButton>
                <BrutalButton
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 bg-accent hover:bg-accent/90 py-3"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </BrutalButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
