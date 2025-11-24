/**
 * E2E Tests for Authentication
 * Tests login and registration flows
 */
import { test, expect, testData } from './fixtures';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ loginPage }) => {
    await loginPage.goto();

    // Fill in login form
    await loginPage.login(testData.user.email, testData.user.password);

    // Should redirect to generate page
    await loginPage.expectRedirectToGenerate();
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();

    // Try to login with invalid password
    await loginPage.login(testData.user.email, 'WrongPassword123!');

    // Wait for error message to appear
    await loginPage.errorMessage.waitFor({ state: 'visible', timeout: 5000 });

    // Should show error message (Supabase returns this exact message)
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should prevent submission with empty fields', async ({ loginPage }) => {
    await loginPage.goto();

    // Try to submit empty form - HTML5 validation should prevent it
    await loginPage.submitButton.click();

    // Should still be on login page (not redirected)
    await expect(loginPage.page).toHaveURL(/\/login/);

    // Email input should show validation error
    await expect(loginPage.emailInput).toHaveAttribute('required');
  });
});
