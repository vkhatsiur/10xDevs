/**
 * Page Object Model for Register Page
 * Handles registration interactions and assertions
 */
import { Page, Locator, expect } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('register-email-input');
    this.passwordInput = page.getByTestId('register-password-input');
    this.confirmPasswordInput = page.getByTestId('register-confirm-password-input');
    this.submitButton = page.getByTestId('register-submit-button');
    this.errorMessage = page.getByTestId('register-error-message');
    this.successMessage = page.getByTestId('register-success-message');
    this.loginLink = page.getByTestId('register-login-link');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(email: string, password: string, confirmPassword?: string) {
    // Use pressSequentially to trigger React onChange events
    await this.emailInput.click();
    await this.emailInput.pressSequentially(email, { delay: 50 });

    await this.passwordInput.click();
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    await this.confirmPasswordInput.click();
    await this.confirmPasswordInput.pressSequentially(confirmPassword || password, { delay: 50 });

    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible();
  }
}
