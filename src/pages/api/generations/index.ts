import type { APIRoute } from 'astro';
import { GenerationService } from '../../../lib/services/generation.service';
import { generateFlashcardsSchema } from '../../../lib/validators/generation.validator';

// Mark as server-rendered (required for POST endpoints in Astro)
export const prerender = false;

// POST /api/generations - Generate flashcard proposals from source text
// IMPORTANT: This endpoint returns proposals WITHOUT saving them to flashcards table
// Users must accept proposals and save them via POST /api/flashcards
export const POST: APIRoute = async ({ request, locals }) => {
  const serviceRoleKey = locals.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY;
  const openRouterApiKey = locals.runtime?.env?.OPENROUTER_API_KEY;
  const generationService = new GenerationService(serviceRoleKey, openRouterApiKey);
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json();

    // Validate request using Zod
    const validation = generateFlashcardsSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: errors.source_text?.[0] || 'Invalid source_text',
          details: {
            source_text_length: body.source_text?.length || 0,
            min_length: 1000,
            max_length: 10000,
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate flashcard proposals with authenticated user
    const result = await generationService.generateFlashcards(
      validation.data.source_text,
      locals.user.id
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to generate flashcards',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
