import type { User } from '@supabase/supabase-js';

/**
 * List of admin email addresses with special privileges
 */
const ADMIN_EMAILS = ['nadavkarlinski@gmail.com'];

/**
 * Check if an email address belongs to an admin user
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if a user object is an admin
 */
export function isAdminUser(user: User | null | undefined): boolean {
  return isAdmin(user?.email);
}

/**
 * Get comprehensive admin status for a user
 */
export function getAdminStatus(user: User | null | undefined) {
  const adminStatus = isAdminUser(user);

  return {
    isAdmin: adminStatus,
    email: user?.email,
    // Admin privileges
    canSkipPayment: adminStatus,
    canCreateWithAnyQuotes: adminStatus,
    canGenerateFullBookImmediately: adminStatus,
    canSkipPreview: adminStatus,
  };
}

/**
 * Get the minimum number of quotes required based on admin status
 */
export function getMinQuotesRequired(user: User | null | undefined): number {
  return isAdminUser(user) ? 1 : 8;
}

/**
 * Get the maximum number of quotes allowed
 */
export function getMaxQuotesAllowed(): number {
  return 8;
}
