import { getServiceSupabase } from '../supabase';
import { hashSourceText } from '../utils';
import { OpenRouterService } from './openrouter.service';
import type { TablesInsert } from '../../db/types';
import type { FlashcardProposal } from '../types/openrouter.types';

export interface GenerationResult {
  generation_id: number;
  flashcards_proposals: Array<FlashcardProposal & { source: 'ai-full' }>;
  generated_count: number;
  generation_duration: number;
  model: string;
}

export class GenerationService {
  private supabase = getServiceSupabase();
  private openRouterService: OpenRouterService;
  // Using GPT-4.1 Mini model
  private model = 'openai/gpt-4.1-mini';

  constructor() {
    // Pass model to OpenRouter service
    this.openRouterService = new OpenRouterService({
      model: this.model,
    });
  }

  /**
   * Generate flashcard proposals from source text
   * Returns proposals WITHOUT saving them to flashcards table
   */
  async generateFlashcards(sourceText: string, userId: string): Promise<GenerationResult> {
    const startTime = Date.now();

    // Hash source text
    const sourceTextHash = hashSourceText(sourceText);
    const sourceTextLength = sourceText.length;

    try {
      // Call AI service to get proposals
      const proposals = await this.openRouterService.generateFlashcards(sourceText);

      // Calculate duration
      const generationDuration = Date.now() - startTime;

      // Create generation record
      const generationData: TablesInsert<'generations'> = {
        user_id: userId,
        model: this.model,
        generated_count: proposals.length,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        generation_duration: generationDuration,
      };

      const { data: generation, error } = await this.supabase
        .from('generations')
        .insert(generationData)
        .select()
        .single();

      if (error || !generation) {
        throw new Error(`Failed to create generation record: ${error?.message}`);
      }

      // Return proposals (NOT saved to flashcards yet)
      return {
        generation_id: generation.id,
        flashcards_proposals: proposals.map((p) => ({
          ...p,
          source: 'ai-full' as const,
        })),
        generated_count: proposals.length,
        generation_duration: generationDuration,
        model: this.model,
      };
    } catch (error) {
      // Log error to database
      await this.logError(userId, sourceTextHash, sourceTextLength, error);

      throw error;
    }
  }

  /**
   * Log generation error to database
   */
  private async logError(
    userId: string,
    sourceTextHash: string,
    sourceTextLength: number,
    error: unknown
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.extractErrorCode(errorMessage);

    const errorLog: TablesInsert<'generation_error_logs'> = {
      user_id: userId,
      model: this.model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: errorCode,
      error_message: errorMessage.substring(0, 1000),
    };

    try {
      await this.supabase.from('generation_error_logs').insert(errorLog);
    } catch (logError) {
      console.error('Failed to log generation error:', logError);
    }
  }

  /**
   * Extract error code from error message
   */
  private extractErrorCode(errorMessage: string): string {
    if (errorMessage.includes('timeout')) return 'API_TIMEOUT';
    if (errorMessage.includes('rate limit')) return 'API_RATE_LIMIT';
    if (errorMessage.includes('HTTP 401')) return 'API_AUTH_ERROR';
    if (errorMessage.includes('HTTP 4')) return 'HTTP_4XX';
    if (errorMessage.includes('HTTP 5')) return 'HTTP_5XX';
    if (errorMessage.includes('parse') || errorMessage.includes('JSON')) return 'INVALID_JSON';
    if (errorMessage.includes('Empty response')) return 'EMPTY_RESPONSE';
    if (errorMessage.includes('Invalid response format')) return 'INVALID_FORMAT';
    return 'UNKNOWN_ERROR';
  }
}
