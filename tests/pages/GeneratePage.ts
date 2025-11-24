/**
 * Page Object Model for Generate Page
 * Handles manual flashcard creation interactions
 */
import { Page, Locator, expect } from '@playwright/test';

export class GeneratePage {
  readonly page: Page;
  readonly manualForm: Locator;
  readonly addCardButton: Locator;
  readonly saveFlashcardsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.manualForm = page.getByTestId('manual-flashcard-form');
    this.addCardButton = page.getByTestId('add-card-button');
    this.saveFlashcardsButton = page.getByTestId('save-flashcards-button');
  }

  async goto() {
    await this.page.goto('/generate');
  }

  async fillFlashcard(index: number, front: string, back: string) {
    const frontInput = this.page.getByTestId(`flashcard-front-${index}`);
    const backInput = this.page.getByTestId(`flashcard-back-${index}`);

    // Use pressSequentially to trigger React onChange events
    await frontInput.click();
    await frontInput.pressSequentially(front, { delay: 30 });

    await backInput.click();
    await backInput.pressSequentially(back, { delay: 30 });
  }

  async addCard() {
    await this.addCardButton.click();
  }

  async removeCard(index: number) {
    const removeButton = this.page.getByTestId(`remove-card-${index}`);
    await removeButton.click();
  }

  async saveFlashcards() {
    await this.saveFlashcardsButton.click();
  }

  async expectFlashcardCount(count: number) {
    for (let i = 0; i < count; i++) {
      const flashcard = this.page.getByTestId(`flashcard-${i}`);
      await expect(flashcard).toBeVisible();
    }
  }

  async expectSuccessToast() {
    // Toast messages are usually visible for a few seconds
    await this.page.waitForSelector('text=/saved successfully/i', { timeout: 5000 });
  }

  async createSingleFlashcard(front: string, back: string) {
    await this.fillFlashcard(0, front, back);
    await this.saveFlashcards();
    await this.expectSuccessToast();
  }

  async createMultipleFlashcards(flashcards: Array<{ front: string; back: string }>) {
    // Fill first card
    await this.fillFlashcard(0, flashcards[0].front, flashcards[0].back);

    // Add and fill additional cards
    for (let i = 1; i < flashcards.length; i++) {
      await this.addCard();
      await this.fillFlashcard(i, flashcards[i].front, flashcards[i].back);
    }

    await this.saveFlashcards();
    await this.expectSuccessToast();
  }
}
