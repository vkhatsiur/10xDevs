/**
 * Playwright Test Fixtures
 * Provides reusable test setup and utilities
 */
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { GeneratePage } from './pages/GeneratePage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Extend basic test with page objects and authenticated user
type Fixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  generatePage: GeneratePage;
  flashcardsPage: FlashcardsPage;
  authenticatedPage: any;
};

export const test = base.extend<Fixtures>({
  // Login Page fixture
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // Register Page fixture
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  // Generate Page fixture
  generatePage: async ({ page }, use) => {
    await use(new GeneratePage(page));
  },

  // Flashcards Page fixture
  flashcardsPage: async ({ page }, use) => {
    await use(new FlashcardsPage(page));
  },

  // Authenticated Page fixture - logs in before test
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.E2E_TEST_EMAIL!,
      process.env.E2E_TEST_PASSWORD!
    );
    await loginPage.expectRedirectToGenerate();
    await use(page);
  },
});

export { expect } from '@playwright/test';

/**
 * Test Data Helpers
 */
export const testData = {
  user: {
    email: process.env.E2E_TEST_EMAIL!,
    password: process.env.E2E_TEST_PASSWORD!,
  },
  flashcard: {
    front: 'What is TypeScript?',
    back: 'A typed superset of JavaScript that compiles to plain JavaScript',
  },
  flashcards: [
    {
      front: 'What is React?',
      back: 'A JavaScript library for building user interfaces',
    },
    {
      front: 'What is Playwright?',
      back: 'An end-to-end testing framework for web applications',
    },
    {
      front: 'What is Supabase?',
      back: 'An open source Firebase alternative',
    },
  ],
};
