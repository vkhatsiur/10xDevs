/**
 * Astro Middleware for Authentication
 * Protects routes and attaches user to context
 */
import { defineMiddleware } from 'astro:middleware';
import { createServerSupabase, getAuthenticatedUser } from './lib/supabase.server';

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client
  const supabase = createServerSupabase(context.cookies);

  // Get user session
  const user = await getAuthenticatedUser(context.cookies);

  // Attach user and supabase to context for use in pages
  context.locals.user = user;
  context.locals.supabase = supabase;

  // Define protected routes
  const protectedPaths = ['/generate', '/flashcards', '/profile'];

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    context.url.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedPath && !user) {
    return context.redirect('/login');
  }

  // Redirect to /generate if already logged in and trying to access auth pages
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some((path) =>
    context.url.pathname.startsWith(path)
  );

  if (isAuthPath && user) {
    return context.redirect('/generate');
  }

  return next();
});
