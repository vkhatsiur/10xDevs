/**
 * E2E Tests for Manual Flashcard Creation
 * Tests creating, editing, and deleting manual flashcards
 */
import { test, expect, testData } from './fixtures';

test.describe('Manual Flashcard Creation', () => {
  // Use authenticated page for all tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should create a single manual flashcard', async ({ authenticatedPage, generatePage, flashcardsPage }) => {
    await generatePage.goto();

    // Create single flashcard
    await generatePage.createSingleFlashcard(
      testData.flashcard.front,
      testData.flashcard.back
    );

    // Navigate to My Flashcards
    await flashcardsPage.goto();

    // Verify flashcard appears in list
    await flashcardsPage.expectFlashcardsVisible(1);
  });

  test('should create multiple manual flashcards', async ({ authenticatedPage, generatePage, flashcardsPage }) => {
    await generatePage.goto();

    // Create multiple flashcards
    await generatePage.createMultipleFlashcards(testData.flashcards);

    // Navigate to My Flashcards
    await flashcardsPage.goto();

    // Verify all flashcards appear
    await flashcardsPage.expectFlashcardsVisible(testData.flashcards.length);
  });

  test('should edit an existing flashcard', async ({ authenticatedPage, generatePage, flashcardsPage }) => {
    // First, create a flashcard
    await generatePage.goto();
    await generatePage.createSingleFlashcard('Original Front', 'Original Back');

    // Navigate to My Flashcards
    await flashcardsPage.goto();

    // Get the first flashcard ID from the page
    // Note: In real scenario, we'd query the API or database for the ID
    // For now, we'll use a workaround by waiting for the flashcard to appear
    await authenticatedPage.waitForTimeout(1000);

    // Click edit on first visible flashcard (assuming at least one exists)
    const firstEditButton = authenticatedPage.locator('[data-testid^="edit-flashcard-"]').first();
    await firstEditButton.click();

    // Edit the flashcard
    await flashcardsPage.editFlashcard('Updated Front', 'Updated Back');

    // Verify success toast
    await flashcardsPage.expectSuccessToast();
  });

  test('should delete a flashcard', async ({ authenticatedPage, generatePage, flashcardsPage }) => {
    // First, create a flashcard
    await generatePage.goto();
    await generatePage.createSingleFlashcard('To Delete', 'This will be deleted');

    // Navigate to My Flashcards
    await flashcardsPage.goto();

    // Wait for flashcard to appear
    await authenticatedPage.waitForTimeout(1000);

    // Delete first visible flashcard
    const firstDeleteButton = authenticatedPage.locator('[data-testid^="delete-flashcard-"]').first();

    // Handle confirmation dialog
    authenticatedPage.once('dialog', dialog => dialog.accept());
    await firstDeleteButton.click();

    // Verify success toast
    await flashcardsPage.expectSuccessToast();
  });

  test('should search flashcards', async ({ authenticatedPage, generatePage, flashcardsPage }) => {
    // Create flashcards with distinct content
    await generatePage.goto();
    await generatePage.createMultipleFlashcards([
      { front: 'React Question', back: 'React Answer' },
      { front: 'Vue Question', back: 'Vue Answer' },
    ]);

    // Navigate to My Flashcards
    await flashcardsPage.goto();

    // Search for "React"
    await flashcardsPage.searchFlashcards('React');

    // Should show only 1 result
    await expect(flashcardsPage.flashcardCount).toContainText('1 of 2 flashcards');

    // Search for something that doesn't exist
    await flashcardsPage.searchFlashcards('Angular');

    // Should show no results
    await flashcardsPage.expectNoSearchResults();
  });
});
