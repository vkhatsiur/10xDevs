/**
 * Flashcard API endpoints - single flashcard operations
 * PUT /api/flashcards/:id - Update a flashcard
 * DELETE /api/flashcards/:id - Delete a flashcard
 */
import type { APIRoute } from 'astro';
import { FlashcardService } from '../../../lib/services/flashcard.service';

export const prerender = false;

// PUT /api/flashcards/:id - Update a flashcard
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const serviceRoleKey = locals.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY;
  const flashcardService = new FlashcardService(serviceRoleKey);
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = parseInt(params.id || '', 10);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid flashcard ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json();
    const { front, back } = body;

    // Validate input
    if (!front || !back) {
      return new Response(JSON.stringify({ error: 'Both front and back are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (front.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Front text exceeds maximum length of 200 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (back.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Back text exceeds maximum length of 500 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update flashcard
    const updatedFlashcard = await flashcardService.updateFlashcard(id, locals.user.id, {
      front,
      back,
    });

    if (!updatedFlashcard) {
      return new Response(JSON.stringify({ error: 'Flashcard not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ flashcard: updatedFlashcard }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating flashcard:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/flashcards/:id - Delete a flashcard
export const DELETE: APIRoute = async ({ params, locals }) => {
  const serviceRoleKey = locals.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY;
  const flashcardService = new FlashcardService(serviceRoleKey);
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = parseInt(params.id || '', 10);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid flashcard ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete flashcard
    const deleted = await flashcardService.deleteFlashcard(id, locals.user.id);

    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Flashcard not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Flashcard deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
