import { z } from 'zod';

/**
 * Schema for generating flashcards from source text
 */
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, 'Source text must be at least 1000 characters')
    .max(10000, 'Source text must be 10000 characters or less'),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
