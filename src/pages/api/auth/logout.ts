/**
 * Logout API endpoint
 * POST /api/auth/logout
 */
import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase.server';

export const POST: APIRoute = async ({ cookies }) => {
  const supabase = createServerSupabase(cookies);

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Logout successful' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
