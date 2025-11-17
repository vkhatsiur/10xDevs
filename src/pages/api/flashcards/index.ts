import type { APIRoute } from 'astro';
import { getServiceSupabase } from '../../../lib/supabase';
import type { TablesInsert } from '../../../db/types';

// GET /api/flashcards - Get all flashcards for a user
export const GET: APIRoute = async ({ request }) => {
  try {
    const supabase = getServiceSupabase();

    // For MVP, we'll use the test user ID
    // In Module 3, this will come from authentication
    const testUserId = '00000000-0000-0000-0000-000000000001';

    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching flashcards:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch flashcards' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ flashcards: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// POST /api/flashcards - Create a new manual flashcard
export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    // Validate input
    const { front, back } = body;

    if (!front || !back) {
      return new Response(
        JSON.stringify({ error: 'Front and back are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate length constraints
    if (front.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Front text must be 200 characters or less' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (back.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Back text must be 500 characters or less' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // For MVP, we'll use the test user ID
    // In Module 3, this will come from authentication
    const testUserId = '00000000-0000-0000-0000-000000000001';

    const newFlashcard: TablesInsert<'flashcards'> = {
      front,
      back,
      source: 'manual',
      user_id: testUserId,
      generation_id: null,
    };

    const { data, error } = await supabase
      .from('flashcards')
      .insert(newFlashcard)
      .select()
      .single();

    if (error) {
      console.error('Error creating flashcard:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create flashcard' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ flashcard: data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
