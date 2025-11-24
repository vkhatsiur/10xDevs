import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate SHA-256 hash of source text
 * Used for caching and deduplication in generation service
 */
export async function hashSourceText(text: string): Promise<string> {
  // Convert string to ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Generate hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
