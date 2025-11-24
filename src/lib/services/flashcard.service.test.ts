/**
 * Tests for FlashcardService
 * CRUD operations with RLS security
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlashcardService } from './flashcard.service';

// Mock Supabase
vi.mock('../supabase', () => ({
  getServiceSupabase: vi.fn(() => mockSupabaseClient),
}));

const mockSupabaseClient = {
  from: vi.fn(),
};

describe('FlashcardService', () => {
  let service: FlashcardService;
  let fromMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new FlashcardService();
    fromMock = vi.fn();
    mockSupabaseClient.from = fromMock;
    vi.clearAllMocks();
  });

  describe('createFlashcards', () => {
    it('should create flashcards successfully', async () => {
      const mockData = [
        { id: 1, front: 'Q1', back: 'A1', source: 'manual', user_id: 'user-123' },
        { id: 2, front: 'Q2', back: 'A2', source: 'ai-full', user_id: 'user-123' },
      ];

      fromMock.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      const flashcards = [
        { front: 'Q1', back: 'A1', source: 'manual' as const, generation_id: null },
        { front: 'Q2', back: 'A2', source: 'ai-full' as const, generation_id: 123 },
      ];

      const result = await service.createFlashcards(flashcards, 'user-123');

      expect(result).toEqual(mockData);
      expect(fromMock).toHaveBeenCalledWith('flashcards');
    });

    it('should throw error on database failure', async () => {
      fromMock.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const flashcards = [
        { front: 'Q1', back: 'A1', source: 'manual' as const, generation_id: null },
      ];

      await expect(
        service.createFlashcards(flashcards, 'user-123')
      ).rejects.toThrow('Failed to create flashcards: Database error');
    });

    it('should add user_id to all flashcards', async () => {
      let insertedData: any;

      fromMock.mockReturnValue({
        insert: vi.fn().mockImplementation((data) => {
          insertedData = data;
          return {
            select: vi.fn().mockResolvedValue({
              data: data.map((fc: any, idx: number) => ({ ...fc, id: idx + 1 })),
              error: null,
            }),
          };
        }),
      });

      const flashcards = [
        { front: 'Q1', back: 'A1', source: 'manual' as const, generation_id: null },
        { front: 'Q2', back: 'A2', source: 'manual' as const, generation_id: null },
      ];

      await service.createFlashcards(flashcards, 'user-456');

      expect(insertedData).toHaveLength(2);
      expect(insertedData[0].user_id).toBe('user-456');
      expect(insertedData[1].user_id).toBe('user-456');
    });
  });

  describe('getFlashcards', () => {
    it('should get all flashcards for user', async () => {
      const mockData = [
        { id: 1, front: 'Q1', back: 'A1', user_id: 'user-123' },
        { id: 2, front: 'Q2', back: 'A2', user_id: 'user-123' },
      ];

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getFlashcards('user-123');

      expect(result).toEqual(mockData);
    });

    it('should return empty array if no flashcards', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getFlashcards('user-123');

      expect(result).toEqual([]);
    });

    it('should throw on database error', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'DB error' },
            }),
          }),
        }),
      });

      await expect(service.getFlashcards('user-123')).rejects.toThrow(
        'Failed to fetch flashcards: DB error'
      );
    });
  });

  describe('updateFlashcard', () => {
    it('should update flashcard successfully', async () => {
      const existingFlashcard = {
        id: 1,
        front: 'Old Q',
        back: 'Old A',
        source: 'ai-full',
        user_id: 'user-123',
      };

      const updatedFlashcard = {
        ...existingFlashcard,
        front: 'New Q',
        back: 'New A',
        source: 'ai-edited',
      };

      // Mock getFlashcardById
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: existingFlashcard,
                  error: null,
                }),
              }),
            }),
          }),
        })
        // Mock update
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: updatedFlashcard,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

      const result = await service.updateFlashcard(1, 'user-123', {
        front: 'New Q',
        back: 'New A',
      });

      expect(result?.source).toBe('ai-edited');
      expect(result?.front).toBe('New Q');
    });

    it('should change source from ai-full to ai-edited', async () => {
      const existingFlashcard = {
        id: 1,
        front: 'Q',
        back: 'A',
        source: 'ai-full',
        user_id: 'user-123',
      };

      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: existingFlashcard,
                  error: null,
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...existingFlashcard, source: 'ai-edited', front: 'New Q' },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

      const result = await service.updateFlashcard(1, 'user-123', { front: 'New Q' });

      expect(result?.source).toBe('ai-edited');
    });

    it('should return null if flashcard not found', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const result = await service.updateFlashcard(999, 'user-123', { front: 'Q' });

      expect(result).toBeNull();
    });
  });

  describe('deleteFlashcard', () => {
    it('should delete flashcard successfully', async () => {
      fromMock.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const result = await service.deleteFlashcard(1, 'user-123');

      expect(result).toBe(true);
    });

    it('should throw on database error', async () => {
      fromMock.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Delete failed' },
            }),
          }),
        }),
      });

      await expect(service.deleteFlashcard(1, 'user-123')).rejects.toThrow(
        'Failed to delete flashcard: Delete failed'
      );
    });
  });

  describe('verifyGenerationOwnership', () => {
    it('should return true if generation belongs to user', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 123 },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.verifyGenerationOwnership(123, 'user-123');

      expect(result).toBe(true);
    });

    it('should return false if generation does not exist', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const result = await service.verifyGenerationOwnership(999, 'user-123');

      expect(result).toBe(false);
    });

    it('should return false if generation belongs to different user', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows' },
              }),
            }),
          }),
        }),
      });

      const result = await service.verifyGenerationOwnership(123, 'wrong-user');

      expect(result).toBe(false);
    });
  });
});
