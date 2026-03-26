/**
 * Retry utility for AI API calls.
 * Retries on network errors and 429/500/503 status codes.
 * Uses exponential backoff with jitter.
 */

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof TypeError) return true; // network errors
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    return status === 429 || status === 500 || status === 503;
  }
  // Check for error message patterns indicating network issues
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('network') || msg.includes('fetch') || msg.includes('econnreset');
  }
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? 3;
  const baseDelayMs = opts?.baseDelayMs ?? 1000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxAttempts || !isRetryableError(err)) {
        throw err;
      }

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);
      console.warn(`[ai-client] Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
