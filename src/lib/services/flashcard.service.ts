import { getServiceSupabase } from '../supabase';
import type { TablesInsert, Tables } from '../../db/types';

export class FlashcardService {
  private supabase;

  constructor(serviceRoleKey?: string) {
    this.supabase = getServiceSupabase(serviceRoleKey);
  }

  /**
   * Create multiple flashcards (batch operation)
   */
  async createFlashcards(
    flashcards: Array<Omit<TablesInsert<'flashcards'>, 'user_id'>>,
    userId: string
  ): Promise<Tables<'flashcards'>[]> {
    // Add user_id to each flashcard
    const flashcardsWithUser = flashcards.map((fc) => ({
      ...fc,
      user_id: userId,
    }));

    // Batch insert
    const { data, error } = await this.supabase
      .from('flashcards')
      .insert(flashcardsWithUser)
      .select();

    if (error) {
      throw new Error(`Failed to create flashcards: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create flashcards: No data returned');
    }

    return data;
  }

  /**
   * Verify that a generation exists and belongs to the user
   */
  async verifyGenerationOwnership(generationId: number, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('id')
      .eq('id', generationId)
      .eq('user_id', userId)
      .single();

    return !error && data !== null;
  }

  /**
   * Get all flashcards for a user
   */
  async getFlashcards(userId: string): Promise<Tables<'flashcards'>[]> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single flashcard by ID
   */
  async getFlashcardById(id: number, userId: string): Promise<Tables<'flashcards'> | null> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Update a flashcard
   * If source is 'ai-full' and user edits it, change source to 'ai-edited'
   */
  async updateFlashcard(
    id: number,
    userId: string,
    updates: { front?: string; back?: string }
  ): Promise<Tables<'flashcards'> | null> {
    // First, get the current flashcard
    const currentFlashcard = await this.getFlashcardById(id, userId);

    if (!currentFlashcard) {
      return null;
    }

    // Determine new source
    let newSource = currentFlashcard.source;
    if (currentFlashcard.source === 'ai-full' && (updates.front || updates.back)) {
      newSource = 'ai-edited';
    }

    // Update flashcard
    const { data, error } = await this.supabase
      .from('flashcards')
      .update({
        ...updates,
        source: newSource,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a flashcard
   */
  async deleteFlashcard(id: number, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }

    return true;
  }
}
