/**
 * Tests for Flashcard Validators
 * Validates flashcard creation data
 */
import { describe, it, expect } from 'vitest';
import { flashcardsCreateSchema } from './flashcard.validator';

describe('Flashcard Validator', () => {
  describe('flashcardsCreateSchema - Valid Data', () => {
    it('should accept valid manual flashcard', () => {
      const input = {
        flashcards: [
          {
            front: 'What is React?',
            back: 'A JavaScript library for building user interfaces',
            source: 'manual' as const,
            generation_id: null,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid ai-full flashcard with generation_id', () => {
      const input = {
        flashcards: [
          {
            front: 'What is TypeScript?',
            back: 'A typed superset of JavaScript',
            source: 'ai-full' as const,
            generation_id: 123,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid ai-edited flashcard with generation_id', () => {
      const input = {
        flashcards: [
          {
            front: 'What is Node.js?',
            back: 'A JavaScript runtime built on Chrome V8 engine',
            source: 'ai-edited' as const,
            generation_id: 456,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept multiple flashcards', () => {
      const input = {
        flashcards: [
          {
            front: 'Q1',
            back: 'A1',
            source: 'manual' as const,
            generation_id: null,
          },
          {
            front: 'Q2',
            back: 'A2',
            source: 'ai-full' as const,
            generation_id: 789,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept front at max length (200 chars)', () => {
      const input = {
        flashcards: [
          {
            front: 'a'.repeat(200),
            back: 'answer',
            source: 'manual' as const,
            generation_id: null,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept back at max length (500 chars)', () => {
      const input = {
        flashcards: [
          {
            front: 'question',
            back: 'a'.repeat(500),
            source: 'manual' as const,
            generation_id: null,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('flashcardsCreateSchema - Invalid Data', () => {
    it('should reject empty front', () => {
      const input = {
        flashcards: [
          {
            front: '',
            back: 'answer',
            source: 'manual' as const,
            generation_id: null,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty back', () => {
      const input = {
        flashcards: [
          {
            front: 'question',
            back: '',
            source: 'manual' as const,
            generation_id: null,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject front exceeding max length (201 chars)', () => {
      const input = {
        flashcards: [
          {
            front: 'a'.repeat(201),
            back: 'answer',
            source: 'manual' as const,
            generation_id: null,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject back exceeding max length (501 chars)', () => {
      const input = {
        flashcards: [
          {
            front: 'question',
            back: 'a'.repeat(501),
            source: 'manual' as const,
            generation_id: null,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid source', () => {
      const input = {
        flashcards: [
          {
            front: 'question',
            back: 'answer',
            source: 'invalid' as any,
            generation_id: null,
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject manual with generation_id', () => {
      const input = {
        flashcards: [
          {
            front: 'question',
            back: 'answer',
            source: 'manual' as const,
            generation_id: 123, // should be null for manual
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject ai-full without generation_id', () => {
      const input = {
        flashcards: [
          {
            front: 'question',
            back: 'answer',
            source: 'ai-full' as const,
            generation_id: null, // should have a number for ai-full
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject ai-edited without generation_id', () => {
      const input = {
        flashcards: [
          {
            front: 'question',
            back: 'answer',
            source: 'ai-edited' as const,
            generation_id: null, // should have a number for ai-edited
          },
        ],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty flashcards array', () => {
      const input = {
        flashcards: [],
      };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject more than 50 flashcards', () => {
      const flashcards = Array(51)
        .fill(null)
        .map(() => ({
          front: 'question',
          back: 'answer',
          source: 'manual' as const,
          generation_id: null,
        }));

      const input = { flashcards };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept exactly 50 flashcards', () => {
      const flashcards = Array(50)
        .fill(null)
        .map(() => ({
          front: 'question',
          back: 'answer',
          source: 'manual' as const,
          generation_id: null,
        }));

      const input = { flashcards };

      const result = flashcardsCreateSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
