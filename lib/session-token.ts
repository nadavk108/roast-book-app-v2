'use client';

// Anonymous session token for unauthenticated book creation.
// Stored in both cookie (for server-readable access) and localStorage (for persistence).
// The token is a UUID that identifies an anonymous user's books until they sign in.

const COOKIE_NAME = 'roast_session_token';
const STORAGE_KEY = 'roast_session_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookieValue(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function removeCookieValue(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the existing session token, or creates and stores a new one.
 * Syncs across both cookie and localStorage on every call.
 */
export function getOrCreateSessionToken(): string {
  const fromCookie = getCookieValue(COOKIE_NAME);
  const fromStorage =
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

  const existing = fromCookie || fromStorage;

  if (existing) {
    // Sync to both stores to refresh expiry
    setCookieValue(COOKIE_NAME, existing, COOKIE_MAX_AGE);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, existing);
    }
    return existing;
  }

  const token = generateUUID();
  setCookieValue(COOKIE_NAME, token, COOKIE_MAX_AGE);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

/**
 * Reads the current session token without creating one.
 * Returns null if no token exists.
 */
export function getSessionToken(): string | null {
  const fromCookie = getCookieValue(COOKIE_NAME);
  const fromStorage =
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  return fromCookie || fromStorage || null;
}

/**
 * Removes the session token from both cookie and localStorage.
 * Call after successful book claim (user linked to book).
 */
export function clearSessionToken(): void {
  removeCookieValue(COOKIE_NAME);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
