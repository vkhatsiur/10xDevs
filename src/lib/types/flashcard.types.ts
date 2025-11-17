/**
 * Frontend types for Flashcard Generation View
 * Based on API contracts from validators and database types
 */

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Command to generate flashcards from source text
 * POST /api/generations
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
}

/**
 * Response from flashcard generation API
 * POST /api/generations -> 201 Created
 */
export interface GenerationCreateResponseDto {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
  generation_duration: number;
  model: string;
}

/**
 * Single flashcard proposal from AI
 * Part of GenerationCreateResponseDto
 */
export interface FlashcardProposalDto {
  front: string;
  back: string;
  source: 'ai-full';
}

/**
 * Command to create flashcards (batch)
 * POST /api/flashcards
 */
export interface FlashcardsCreateCommand {
  flashcards: FlashcardCreateDto[];
}

/**
 * Single flashcard data for creation
 * Part of FlashcardsCreateCommand
 */
export interface FlashcardCreateDto {
  front: string; // max 200 chars
  back: string; // max 500 chars
  source: 'ai-full' | 'ai-edited' | 'manual';
  generation_id: number | null;
}

/**
 * Response from flashcard creation API
 * POST /api/flashcards -> 201 Created
 */
export interface FlashcardsCreateResponseDto {
  flashcards: FlashcardDto[];
}

/**
 * Flashcard data from database
 */
export interface FlashcardDto {
  id: number;
  user_id: string;
  front: string;
  back: string;
  source: 'ai-full' | 'ai-edited' | 'manual';
  generation_id: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// View Model Types (Frontend State)
// ============================================================================

/**
 * Extended flashcard proposal with UI state
 * Used in frontend for managing proposal interactions
 */
export interface FlashcardProposalViewModel extends FlashcardProposalDto {
  id: string; // temporary client-side ID (crypto.randomUUID())
  accepted: boolean; // user accepted this proposal
  editing: boolean; // currently in edit mode
  source: 'ai-full' | 'ai-edited'; // source changes to ai-edited when edited
}

/**
 * Main state for FlashcardGenerator view
 */
export interface GenerateViewState {
  // Text input state
  sourceText: string;
  textError: string | null;

  // Generation state
  isGenerating: boolean;
  generationId: number | null;
  proposals: FlashcardProposalViewModel[];
  generationError: string | null;

  // Save state
  isSaving: boolean;
  saveError: string | null;
}

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  SOURCE_TEXT_MIN: 1000,
  SOURCE_TEXT_MAX: 10000,
  FLASHCARD_FRONT_MAX: 200,
  FLASHCARD_BACK_MAX: 500,
} as const;

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Result of text validation
 */
export interface TextValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Statistics for proposals
 */
export interface ProposalStats {
  total: number;
  accepted: number;
  edited: number;
  rejected: number;
}
