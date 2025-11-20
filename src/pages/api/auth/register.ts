/**
 * Registration API endpoint
 * POST /api/auth/register
 */
import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../../lib/supabase.server';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createServerSupabase(cookies);

  try {
    const { email, password, confirmPassword } = await request.json();

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password !== confirmPassword) {
      return new Response(
        JSON.stringify({ error: 'Passwords do not match' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if email confirmation is required
    const needsConfirmation = data.user && !data.session;

    return new Response(
      JSON.stringify({
        message: needsConfirmation
          ? 'Registration successful! Please check your email to confirm your account.'
          : 'Registration successful! You can now log in.',
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        needsConfirmation,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
