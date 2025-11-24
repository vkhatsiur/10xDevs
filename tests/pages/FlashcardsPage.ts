/**
 * Page Object Model for My Flashcards Page
 * Handles flashcard list, search, edit, and delete interactions
 */
import { Page, Locator, expect } from '@playwright/test';

export class FlashcardsPage {
  readonly page: Page;
  readonly flashcardList: Locator;
  readonly searchInput: Locator;
  readonly flashcardCount: Locator;
  readonly addMoreButton: Locator;
  readonly flashcardGrid: Locator;
  readonly emptyState: Locator;
  readonly editDialog: Locator;
  readonly editFrontInput: Locator;
  readonly editBackInput: Locator;
  readonly editSaveButton: Locator;
  readonly editCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.flashcardList = page.getByTestId('flashcard-list');
    this.searchInput = page.getByTestId('flashcard-search-input');
    this.flashcardCount = page.getByTestId('flashcard-count');
    this.addMoreButton = page.getByTestId('add-more-flashcards-button');
    this.flashcardGrid = page.getByTestId('flashcard-grid');
    this.emptyState = page.getByTestId('flashcard-list-empty');
    this.editDialog = page.getByTestId('edit-flashcard-dialog');
    this.editFrontInput = page.getByTestId('edit-flashcard-front-input');
    this.editBackInput = page.getByTestId('edit-flashcard-back-input');
    this.editSaveButton = page.getByTestId('edit-flashcard-save-button');
    this.editCancelButton = page.getByTestId('edit-flashcard-cancel-button');
  }

  async goto() {
    await this.page.goto('/my-flashcards');
  }

  async searchFlashcards(query: string) {
    await this.searchInput.fill(query);
  }

  async expectFlashcardCount(count: number) {
    await expect(this.flashcardCount).toContainText(`${count} flashcard`);
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async getFlashcard(id: number) {
    return this.page.getByTestId(`flashcard-item-${id}`);
  }

  async clickEditFlashcard(id: number) {
    const editButton = this.page.getByTestId(`edit-flashcard-${id}`);
    await editButton.click();
  }

  async clickDeleteFlashcard(id: number) {
    const deleteButton = this.page.getByTestId(`delete-flashcard-${id}`);

    // Handle browser confirmation dialog
    this.page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();
  }

  async editFlashcard(front: string, back: string) {
    await expect(this.editDialog).toBeVisible();

    // Clear and fill with pressSequentially to trigger React onChange
    await this.editFrontInput.click();
    await this.editFrontInput.clear();
    await this.editFrontInput.pressSequentially(front, { delay: 30 });

    await this.editBackInput.click();
    await this.editBackInput.clear();
    await this.editBackInput.pressSequentially(back, { delay: 30 });

    await this.editSaveButton.click();
  }

  async cancelEdit() {
    await this.editCancelButton.click();
    await expect(this.editDialog).not.toBeVisible();
  }

  async expectSuccessToast() {
    await this.page.waitForSelector('text=/successfully/i', { timeout: 5000 });
  }

  async expectFlashcardsVisible(count: number) {
    const flashcards = this.flashcardGrid.locator('[data-testid^="flashcard-item-"]');
    await expect(flashcards).toHaveCount(count);
  }

  async expectNoSearchResults() {
    const noResults = this.page.getByTestId('no-search-results');
    await expect(noResults).toBeVisible();
  }
}
