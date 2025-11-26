import type { APIRoute } from 'astro';
import { FlashcardService } from '../../../lib/services/flashcard.service';
import { flashcardsCreateSchema } from '../../../lib/validators/flashcard.validator';

// Mark as server-rendered (required for POST endpoints in Astro)
export const prerender = false;

const flashcardService = new FlashcardService();

// GET /api/flashcards - Get all flashcards for a user
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const flashcards = await flashcardService.getFlashcards(locals.user.id);

    return new Response(
      JSON.stringify({
        data: flashcards,
        pagination: {
          page: 1,
          limit: flashcards.length,
          total: flashcards.length,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/flashcards - Create one or more flashcards
export const POST: APIRoute = async ({ request, locals }) => {
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
    const validation = flashcardsCreateSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify generation ownership for AI sources
    for (const flashcard of validation.data.flashcards) {
      if (flashcard.generation_id !== null) {
        const isOwner = await flashcardService.verifyGenerationOwnership(
          flashcard.generation_id,
          locals.user.id
        );

        if (!isOwner) {
          return new Response(
            JSON.stringify({
              error: 'Generation not found',
              details: { generation_id: flashcard.generation_id },
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // Create flashcards
    const createdFlashcards = await flashcardService.createFlashcards(
      validation.data.flashcards,
      locals.user.id
    );

    return new Response(JSON.stringify({ flashcards: createdFlashcards }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating flashcards:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
