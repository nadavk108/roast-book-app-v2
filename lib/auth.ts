'use client';

import { createClient } from './supabase-browser';
import { captureEvent, resetUser, identifyUser, Events } from './posthog';
import { isAdmin } from './admin';

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();

  captureEvent(Events.EMAIL_SIGNIN_CLICKED);

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData.user && signInData.session) {
    captureEvent(Events.EMAIL_SIGNIN_COMPLETED, {
      is_new_user: false,
    });

    return {
      user: signInData.user,
      session: signInData.session,
      isNewUser: false
    };
  }

  if (signInError?.message?.includes('Invalid login credentials')) {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://theroastbook.com').trim();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback`,
      },
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    if (!signUpData.user) {
      throw new Error('Sign up failed');
    }

    captureEvent(Events.EMAIL_SIGNIN_COMPLETED, {
      is_new_user: true,
    });

    return {
      user: signUpData.user,
      session: signUpData.session,
      isNewUser: true,
      needsEmailVerification: !signUpData.session
    };
  }

  throw new Error(signInError?.message || 'Authentication failed');
}

export async function resetPassword(email: string) {
  const supabase = createClient();

  captureEvent(Events.PASSWORD_RESET_REQUESTED);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://theroastbook.com').trim();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/reset-password`,
  });

  if (error) throw error;
  return { success: true };
}

export async function signInWithGoogle(nextUrl?: string) {
  const supabase = createClient();

  captureEvent(Events.GOOGLE_SIGNIN_CLICKED);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://theroastbook.com').trim();
  const destination = nextUrl || '/dashboard';
  const callbackUrl = `${baseUrl}/auth/callback?next=${encodeURIComponent(destination)}`;

  console.log('[GOOGLE SIGNIN] callbackUrl:', callbackUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error('[GOOGLE SIGNIN] ❌ OAuth error:', error);
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();

  captureEvent(Events.SIGNOUT_CLICKED);
  resetUser();

  await supabase.auth.signOut();
  window.location.href = '/';
}

export async function identifyUserInAnalytics(user: any) {
  if (!user) return;

  const adminStatus = isAdmin(user.email);

  identifyUser(user.id, {
    email: user.email,
    name: user.user_metadata?.full_name,
    is_admin: adminStatus,
  });

  captureEvent(Events.GOOGLE_SIGNIN_COMPLETED, {
    is_admin: adminStatus,
  });

  if (adminStatus) {
    captureEvent(Events.ADMIN_LOGIN, {
      email: user.email,
    });
  }
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}