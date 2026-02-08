/**
 * Retry utility with exponential backoff
 * Helps handle transient failures in API calls and network operations
 */

type RetryOptions = {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (error: Error, attempt: number) => void;
};

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws The last error if all retries fail
 *
 * @example
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxAttempts: 3, initialDelayMs: 2000 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 2000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let currentDelay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Log retry attempt
      if (onRetry) {
        onRetry(lastError, attempt);
      } else {
        console.log(
          `Retry attempt ${attempt}/${maxAttempts} after ${currentDelay}ms delay. Error: ${lastError.message}`
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay));

      // Increase delay for next attempt (exponential backoff)
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  // TypeScript needs this but it's unreachable
  throw lastError!;
}

/**
 * Retry with context-aware logging (useful for batch operations)
 *
 * @example
 * await withRetryContext(
 *   () => generateImage(prompt),
 *   { context: `[${bookId}] Image ${index}`, maxAttempts: 3 }
 * );
 */
export async function withRetryContext<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { context?: string } = {}
): Promise<T> {
  const { context, ...retryOptions } = options;

  return withRetry(fn, {
    ...retryOptions,
    onRetry: (error, attempt) => {
      const prefix = context ? `${context} - ` : '';
      const delay = retryOptions.initialDelayMs || 2000;
      const currentDelay = delay * Math.pow(retryOptions.backoffMultiplier || 2, attempt - 1);
      console.log(
        `${prefix}Retry ${attempt}/${retryOptions.maxAttempts || 3} after ${currentDelay}ms. Error: ${error.message}`
      );
    },
  });
}
