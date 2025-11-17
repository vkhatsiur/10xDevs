import { useState, useCallback } from 'react';
import type {
  GenerateViewState,
  FlashcardProposalViewModel,
  GenerateFlashcardsCommand,
  GenerationCreateResponseDto,
  FlashcardsCreateCommand,
  FlashcardCreateDto,
  FlashcardsCreateResponseDto,
  TextValidationResult,
  ProposalStats,
} from '../types/flashcard.types';
import { VALIDATION } from '../types/flashcard.types';

/**
 * Custom hook for managing flashcard generation state and API calls
 */
export function useFlashcardGeneration() {
  // ============================================================================
  // State
  // ============================================================================

  const [state, setState] = useState<GenerateViewState>({
    sourceText: '',
    textError: null,
    isGenerating: false,
    generationId: null,
    proposals: [],
    generationError: null,
    isSaving: false,
    saveError: null,
  });

  // ============================================================================
  // Text Input Validation
  // ============================================================================

  const validateSourceText = useCallback((text: string): TextValidationResult => {
    if (text.length < VALIDATION.SOURCE_TEXT_MIN) {
      return {
        isValid: false,
        error: `Text must be at least ${VALIDATION.SOURCE_TEXT_MIN} characters (current: ${text.length})`,
      };
    }

    if (text.length > VALIDATION.SOURCE_TEXT_MAX) {
      return {
        isValid: false,
        error: `Text must be no more than ${VALIDATION.SOURCE_TEXT_MAX} characters (current: ${text.length})`,
      };
    }

    return { isValid: true, error: null };
  }, []);

  const updateSourceText = useCallback(
    (text: string) => {
      const validation = validateSourceText(text);
      setState((prev) => ({
        ...prev,
        sourceText: text,
        textError: validation.error,
      }));
    },
    [validateSourceText]
  );

  // ============================================================================
  // Generate Flashcards (POST /api/generations)
  // ============================================================================

  const generateFlashcards = useCallback(async () => {
    const validation = validateSourceText(state.sourceText);
    if (!validation.isValid) {
      setState((prev) => ({ ...prev, textError: validation.error }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isGenerating: true,
      generationError: null,
      proposals: [],
      generationId: null,
    }));

    try {
      const command: GenerateFlashcardsCommand = {
        source_text: state.sourceText,
      };

      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenerationCreateResponseDto = await response.json();

      // Convert proposals to view models with client-side IDs
      const proposals: FlashcardProposalViewModel[] = data.flashcards_proposals.map((proposal) => ({
        ...proposal,
        id: crypto.randomUUID(),
        accepted: false,
        editing: false,
      }));

      setState((prev) => ({
        ...prev,
        isGenerating: false,
        generationId: data.generation_id,
        proposals,
        generationError: null,
      }));
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        generationError: error instanceof Error ? error.message : 'Failed to generate flashcards',
      }));
    }
  }, [state.sourceText, validateSourceText]);

  // ============================================================================
  // Proposal Actions (Accept, Edit, Reject)
  // ============================================================================

  const acceptProposal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.map((p) => (p.id === id ? { ...p, accepted: !p.accepted } : p)),
    }));
  }, []);

  const startEditProposal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.map((p) => (p.id === id ? { ...p, editing: true } : p)),
    }));
  }, []);

  const saveEditProposal = useCallback((id: string, front: string, back: string) => {
    // Validate lengths
    if (front.length > VALIDATION.FLASHCARD_FRONT_MAX) {
      throw new Error(`Front text must be no more than ${VALIDATION.FLASHCARD_FRONT_MAX} characters`);
    }
    if (back.length > VALIDATION.FLASHCARD_BACK_MAX) {
      throw new Error(`Back text must be no more than ${VALIDATION.FLASHCARD_BACK_MAX} characters`);
    }

    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              front,
              back,
              source: 'ai-edited' as const,
              editing: false,
              accepted: true, // Auto-accept edited proposals
            }
          : p
      ),
    }));
  }, []);

  const cancelEditProposal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.map((p) => (p.id === id ? { ...p, editing: false } : p)),
    }));
  }, []);

  const rejectProposal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.filter((p) => p.id !== id),
    }));
  }, []);

  // ============================================================================
  // Save Flashcards (POST /api/flashcards)
  // ============================================================================

  const saveFlashcards = useCallback(
    async (saveAll: boolean = false) => {
      const proposalsToSave = saveAll
        ? state.proposals
        : state.proposals.filter((p) => p.accepted);

      if (proposalsToSave.length === 0) {
        setState((prev) => ({
          ...prev,
          saveError: 'No flashcards to save',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSaving: true,
        saveError: null,
      }));

      try {
        const flashcardsDto: FlashcardCreateDto[] = proposalsToSave.map((proposal) => ({
          front: proposal.front,
          back: proposal.back,
          source: proposal.source,
          generation_id: state.generationId,
        }));

        const command: FlashcardsCreateCommand = {
          flashcards: flashcardsDto,
        };

        const response = await fetch('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data: FlashcardsCreateResponseDto = await response.json();

        setState((prev) => ({
          ...prev,
          isSaving: false,
          saveError: null,
        }));

        return data.flashcards;
      } catch (error) {
        console.error('Error saving flashcards:', error);
        setState((prev) => ({
          ...prev,
          isSaving: false,
          saveError: error instanceof Error ? error.message : 'Failed to save flashcards',
        }));
        return undefined;
      }
    },
    [state.proposals, state.generationId]
  );

  // ============================================================================
  // Reset State
  // ============================================================================

  const resetState = useCallback(() => {
    setState({
      sourceText: '',
      textError: null,
      isGenerating: false,
      generationId: null,
      proposals: [],
      generationError: null,
      isSaving: false,
      saveError: null,
    });
  }, []);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const stats: ProposalStats = {
    total: state.proposals.length,
    accepted: state.proposals.filter((p) => p.accepted).length,
    edited: state.proposals.filter((p) => p.source === 'ai-edited').length,
    rejected: 0, // Rejected proposals are removed from the list
  };

  const canGenerate = state.sourceText.length >= VALIDATION.SOURCE_TEXT_MIN &&
                      state.sourceText.length <= VALIDATION.SOURCE_TEXT_MAX &&
                      !state.isGenerating;

  const canSave = state.proposals.length > 0 && !state.isSaving;

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    state,
    stats,

    // Computed flags
    canGenerate,
    canSave,

    // Actions
    updateSourceText,
    generateFlashcards,
    acceptProposal,
    startEditProposal,
    saveEditProposal,
    cancelEditProposal,
    rejectProposal,
    saveFlashcards,
    resetState,
  };
}
