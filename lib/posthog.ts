import posthog from 'posthog-js';

/**
 * Capture a custom event with PostHog
 * @param eventName - Name of the event
 * @param properties - Additional properties to track
 */
export function captureEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(eventName, properties);
  }
}

/**
 * Identify a user in PostHog
 * @param userId - Unique user identifier
 * @param properties - User properties
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, properties);
  }
}

/**
 * Reset user identity (on logout)
 */
export function resetUser() {
  if (typeof window !== 'undefined' && posthog) {
    posthog.reset();
  }
}

/**
 * Set user properties
 * @param properties - Properties to set
 */
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.setPersonProperties(properties);
  }
}

// Predefined event names for consistency
export const Events = {
  // Authentication
  GOOGLE_SIGNIN_CLICKED: 'google_signin_clicked',
  GOOGLE_SIGNIN_COMPLETED: 'google_signin_completed',
  EMAIL_SIGNIN_CLICKED: 'email_signin_clicked',
  EMAIL_SIGNIN_COMPLETED: 'email_signin_completed',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  SIGNOUT_CLICKED: 'signout_clicked',
  ADMIN_LOGIN: 'admin_login',

  // Book Creation Flow
  BOOK_CREATION_STARTED: 'book_creation_started',
  QUOTES_SUBMITTED: 'quotes_submitted',
  PREVIEW_GENERATION_STARTED: 'preview_generation_started',
  PREVIEW_GENERATED: 'preview_generated',

  // Payment Flow
  CHECKOUT_INITIATED: 'checkout_initiated',
  PAYMENT_COMPLETED: 'payment_completed',

  // Completion
  BOOK_COMPLETED: 'book_completed',

  // AI Features
  ROAST_ASSISTANT_OPENED: 'roast_assistant_opened',
  ROAST_ASSISTANT_USED: 'roast_assistant_used',

  // CTA Interactions
  START_ROASTING_CLICKED: 'start_roasting_clicked',

  // Admin Actions
  ADMIN_BOOK_CREATED: 'admin_book_created',
} as const;
