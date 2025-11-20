/**
 * Supabase Server Client
 * Used in Astro pages and API routes with cookie-based sessions
 */
import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

export function createServerSupabase(cookies: AstroCookies) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookies.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          cookies.set(key, value, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: 'lax',
            httpOnly: true,
            secure: import.meta.env.PROD,
          });
        },
        removeItem: (key: string) => {
          cookies.delete(key, { path: '/' });
        },
      },
    },
  });
}

/**
 * Get authenticated user from cookies
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(cookies: AstroCookies) {
  const supabase = createServerSupabase(cookies);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session.user;
}
