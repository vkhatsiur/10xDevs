/**
 * Vitest Setup File
 * Global test configuration and mocks
 */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv('PUBLIC_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');

// Mock crypto.randomUUID for consistent test IDs
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}
if (!globalThis.crypto.randomUUID) {
  let counter = 0;
  globalThis.crypto.randomUUID = () => {
    counter++;
    return `test-uuid-${counter.toString().padStart(4, '0')}`;
  };
}

// Mock fetch globally (can be overridden in specific tests)
globalThis.fetch = vi.fn();
