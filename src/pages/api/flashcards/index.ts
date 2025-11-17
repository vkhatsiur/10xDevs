import type { APIRoute } from 'astro';
import { FlashcardService } from '../../../lib/services/flashcard.service';
import { flashcardsCreateSchema } from '../../../lib/validators/flashcard.validator';

const flashcardService = new FlashcardService();

// GET /api/flashcards - Get all flashcards for a user
export const GET: APIRoute = async () => {
  try {
    // For MVP, we'll use the test user ID
    // In Module 3, this will come from authentication
    const testUserId = '00000000-0000-0000-0000-000000000001';

    const flashcards = await flashcardService.getFlashcards(testUserId);

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
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST /api/flashcards - Create one or more flashcards
export const POST: APIRoute = async ({ request }) => {
  try {
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

    // For MVP, we'll use the test user ID
    // In Module 3, this will come from authentication
    const testUserId = '00000000-0000-0000-0000-000000000001';

    // Verify generation ownership for AI sources
    for (const flashcard of validation.data.flashcards) {
      if (flashcard.generation_id !== null) {
        const isOwner = await flashcardService.verifyGenerationOwnership(
          flashcard.generation_id,
          testUserId
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
      testUserId
    );

    return new Response(
      JSON.stringify({ flashcards: createdFlashcards }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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
