import type { APIRoute } from 'astro';
import { GenerationService } from '../../../lib/services/generation.service';
import { generateFlashcardsSchema } from '../../../lib/validators/generation.validator';

const generationService = new GenerationService();

// POST /api/generations - Generate flashcard proposals from source text
// IMPORTANT: This endpoint returns proposals WITHOUT saving them to flashcards table
// Users must accept proposals and save them via POST /api/flashcards
export const POST: APIRoute = async ({ request }) => {
  try {
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

    // For MVP, we'll use the test user ID
    // In Module 3, this will come from authentication
    const testUserId = '00000000-0000-0000-0000-000000000001';

    // Generate flashcard proposals
    const result = await generationService.generateFlashcards(
      validation.data.source_text,
      testUserId
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
