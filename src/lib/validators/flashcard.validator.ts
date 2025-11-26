import { z } from 'zod';

/**
 * Schema for a single flashcard creation
 */
const flashcardSchema = z
  .object({
    front: z
      .string()
      .min(1, 'Front text is required')
      .max(200, 'Front text exceeds maximum length of 200 characters'),
    back: z
      .string()
      .min(1, 'Back text is required')
      .max(500, 'Back text exceeds maximum length of 500 characters'),
    source: z.enum(['ai-full', 'ai-edited', 'manual'], {
      errorMap: () => ({
        message: 'Invalid source value. Must be one of: ai-full, ai-edited, manual',
      }),
    }),
    generation_id: z.number().nullable(),
  })
  .refine(
    (data) => {
      // For AI sources, generation_id must be present
      if (
        (data.source === 'ai-full' || data.source === 'ai-edited') &&
        data.generation_id === null
      ) {
        return false;
      }
      // For manual source, generation_id must be null
      if (data.source === 'manual' && data.generation_id !== null) {
        return false;
      }
      return true;
    },
    {
      message:
        'generation_id is required for ai-full/ai-edited source and must be null for manual source',
      path: ['generation_id'],
    }
  );

/**
 * Schema for creating multiple flashcards
 */
export const flashcardsCreateSchema = z.object({
  flashcards: z
    .array(flashcardSchema)
    .min(1, 'At least one flashcard is required')
    .max(50, 'Maximum 50 flashcards per request'),
});

export type FlashcardCreateInput = z.infer<typeof flashcardSchema>;
export type FlashcardsCreateInput = z.infer<typeof flashcardsCreateSchema>;
