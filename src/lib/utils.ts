import { createHash } from 'crypto';

/**
 * Hash source text using SHA-256
 * Used for privacy and duplicate detection
 */
export function hashSourceText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Validate source text length
 */
export function validateSourceTextLength(text: string): {
  isValid: boolean;
  error?: string;
} {
  const length = text.length;

  if (length < 1000) {
    return {
      isValid: false,
      error: 'Source text must be at least 1000 characters',
    };
  }

  if (length > 10000) {
    return {
      isValid: false,
      error: 'Source text must be 10000 characters or less',
    };
  }

  return { isValid: true };
}
