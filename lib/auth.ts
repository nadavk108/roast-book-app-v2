'use client';

import { createClient } from './supabase-browser';
import { captureEvent, resetUser, identifyUser, Events } from './posthog';
import { isAdmin } from './admin';

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();

  // Track email auth attempt
  captureEvent(Events.EMAIL_SIGNIN_CLICKED);

  // STEP 1: Try to sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If sign in succeeds, return
  if (signInData.user && signInData.session) {
    // Track successful sign in
    captureEvent(Events.EMAIL_SIGNIN_COMPLETED, {
      is_new_user: false,
    });

    return {
      user: signInData.user,
      session: signInData.session,
      isNewUser: false
    };
  }

  // STEP 2: If sign in failed because user doesn't exist, try sign up
  if (signInError?.message?.includes('Invalid login credentials')) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/callback`,
      },
    });

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    if (!signUpData.user) {
      throw new Error('Sign up failed');
    }

    // Track successful sign up
    captureEvent(Events.EMAIL_SIGNIN_COMPLETED, {
      is_new_user: true,
    });

    return {
      user: signUpData.user,
      session: signUpData.session,
      isNewUser: true,
      needsEmailVerification: !signUpData.session // If no session, email verification is required
    };
  }

  // STEP 3: If sign in failed for other reason (wrong password), throw error
  throw new Error(signInError?.message || 'Authentication failed');
}

export async function resetPassword(email: string) {
  const supabase = createClient();

  // Track password reset request
  captureEvent(Events.PASSWORD_RESET_REQUESTED);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/reset-password`,
  });

  if (error) throw error;
  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = createClient();

  // Track sign-in attempt
  captureEvent(Events.GOOGLE_SIGNIN_CLICKED);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClient();

  // Track sign-out
  captureEvent(Events.SIGNOUT_CLICKED);

  // Reset PostHog user identity
  resetUser();

  await supabase.auth.signOut();
  window.location.href = '/';
}

export async function identifyUserInAnalytics(user: any) {
  if (!user) return;

  const adminStatus = isAdmin(user.email);

  // Identify user in PostHog
  identifyUser(user.id, {
    email: user.email,
    name: user.user_metadata?.full_name,
    is_admin: adminStatus,
  });

  // Track completed sign-in
  captureEvent(Events.GOOGLE_SIGNIN_COMPLETED, {
    is_admin: adminStatus,
  });

  // Track admin login separately
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
