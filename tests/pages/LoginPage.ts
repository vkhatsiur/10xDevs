/**
 * Page Object Model for Login Page
 * Handles login interactions and assertions
 */
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByTestId('login-error-message');
    this.registerLink = page.getByTestId('login-register-link');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    // Use pressSequentially to trigger React onChange events
    await this.emailInput.click();
    await this.emailInput.pressSequentially(email, { delay: 50 });

    await this.passwordInput.click();
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectRedirectToGenerate() {
    await this.page.waitForURL('/generate', { timeout: 10000 });
    expect(this.page.url()).toContain('/generate');
  }
}
