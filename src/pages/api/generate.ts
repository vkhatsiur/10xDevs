import type { APIRoute } from 'astro';
import { getServiceSupabase } from '../../lib/supabase';
import { hashSourceText, validateSourceTextLength } from '../../lib/utils';
import type { TablesInsert } from '../../db/types';

interface GeneratedFlashcard {
  front: string;
  back: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini'; // As specified in PRD

// POST /api/generate - Generate flashcards from source text using AI
export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();

  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    // Validate input
    const { sourceText } = body;

    if (!sourceText || typeof sourceText !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Source text is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate source text length
    const validation = validateSourceTextLength(sourceText);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash source text
    const sourceTextHash = hashSourceText(sourceText);
    const sourceTextLength = sourceText.length;

    // For MVP, we'll use the test user ID
    const testUserId = '00000000-0000-0000-0000-000000000001';

    // Get OpenRouter API key
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      return new Response(
        JSON.stringify({
          error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare AI prompt
    const prompt = `Generate flashcards from the following text. Create 3-5 high-quality flashcards.

Requirements:
- Each flashcard must have a "front" (question) and "back" (answer)
- Front text must be 200 characters or less
- Back text must be 500 characters or less
- Focus on key concepts, definitions, and important facts
- Make questions clear and specific
- Provide comprehensive but concise answers

Return ONLY a valid JSON array with this exact structure:
[
  {"front": "question here", "back": "answer here"},
  {"front": "question here", "back": "answer here"}
]

Source text:
${sourceText}`;

    // Call OpenRouter API
    let aiResponse: OpenRouterResponse;
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://10xcards.app',
          'X-Title': '10xCards',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenRouter API error:', errorData);

        // Log error to database
        const errorLog: TablesInsert<'generation_error_logs'> = {
          user_id: testUserId,
          model: MODEL,
          source_text_hash: sourceTextHash,
          source_text_length: sourceTextLength,
          error_code: `HTTP_${response.status}`,
          error_message: errorData.substring(0, 1000),
        };

        await supabase.from('generation_error_logs').insert(errorLog);

        return new Response(
          JSON.stringify({
            error: 'Failed to generate flashcards from AI',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      aiResponse = await response.json();
    } catch (apiError) {
      console.error('OpenRouter API call failed:', apiError);

      // Log error to database
      const errorLog: TablesInsert<'generation_error_logs'> = {
        user_id: testUserId,
        model: MODEL,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: 'API_CALL_FAILED',
        error_message:
          apiError instanceof Error ? apiError.message : 'Unknown error',
      };

      await supabase.from('generation_error_logs').insert(errorLog);

      return new Response(
        JSON.stringify({
          error: 'Failed to call AI service',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse AI response
    const aiContent = aiResponse.choices[0]?.message?.content;

    if (!aiContent) {
      const errorLog: TablesInsert<'generation_error_logs'> = {
        user_id: testUserId,
        model: MODEL,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: 'EMPTY_RESPONSE',
        error_message: 'AI returned empty response',
      };

      await supabase.from('generation_error_logs').insert(errorLog);

      return new Response(
        JSON.stringify({
          error: 'AI returned empty response',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract JSON from response (AI might wrap it in markdown code blocks)
    let jsonContent = aiContent.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }

    let generatedFlashcards: GeneratedFlashcard[];
    try {
      generatedFlashcards = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI response content:', aiContent);

      const errorLog: TablesInsert<'generation_error_logs'> = {
        user_id: testUserId,
        model: MODEL,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: 'INVALID_JSON',
        error_message: `Failed to parse JSON: ${aiContent.substring(0, 500)}`,
      };

      await supabase.from('generation_error_logs').insert(errorLog);

      return new Response(
        JSON.stringify({
          error: 'Failed to parse AI response',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate generated flashcards
    if (!Array.isArray(generatedFlashcards) || generatedFlashcards.length === 0) {
      const errorLog: TablesInsert<'generation_error_logs'> = {
        user_id: testUserId,
        model: MODEL,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: 'INVALID_FORMAT',
        error_message: 'AI returned invalid flashcard format',
      };

      await supabase.from('generation_error_logs').insert(errorLog);

      return new Response(
        JSON.stringify({
          error: 'AI returned invalid flashcard format',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate generation duration
    const generationDuration = Date.now() - startTime;

    // Create generation record
    const generationRecord: TablesInsert<'generations'> = {
      user_id: testUserId,
      model: MODEL,
      generated_count: generatedFlashcards.length,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      generation_duration: generationDuration,
    };

    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert(generationRecord)
      .select()
      .single();

    if (generationError || !generation) {
      console.error('Failed to create generation record:', generationError);
      return new Response(
        JSON.stringify({
          error: 'Failed to save generation record',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create flashcard records
    const flashcardsToInsert: TablesInsert<'flashcards'>[] =
      generatedFlashcards.map((card) => ({
        front: card.front.substring(0, 200), // Ensure length constraint
        back: card.back.substring(0, 500), // Ensure length constraint
        source: 'ai-full',
        user_id: testUserId,
        generation_id: generation.id,
      }));

    const { data: flashcards, error: flashcardsError } = await supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select();

    if (flashcardsError || !flashcards) {
      console.error('Failed to create flashcards:', flashcardsError);
      return new Response(
        JSON.stringify({
          error: 'Failed to save flashcards',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        generation: {
          id: generation.id,
          generated_count: flashcards.length,
          generation_duration: generationDuration,
          model: MODEL,
        },
        flashcards,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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
