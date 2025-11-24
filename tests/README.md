# E2E Testing with Playwright

End-to-end tests for 10xCards application using Playwright and cloud Supabase.

## Overview

This test suite covers:
- **Authentication flows** (login, registration, validation) - 3 tests ✅
- **Manual flashcard creation** - 5 tests (out of minimal scope)

## Prerequisites

1. **Cloud Supabase project** with test database
2. **Test user created** in Supabase Auth
3. **Environment configuration** in `.env.test`
4. **Playwright installed** with Chromium browser

## Quick Start

```bash
cd src

# Run all tests (headless)
npm run test:e2e

# Run with visible browser (development)
npm run test:e2e:headed

# Run with Playwright UI (debugging)
npm run test:e2e:ui

# View test report
npm run test:e2e:report

# Clean up test data
npm run test:e2e:teardown
```

## Environment Configuration

Tests use cloud Supabase credentials from `.env.test`:

```bash
# Supabase Configuration (Cloud - E2E Testing)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_key

# Test User Credentials
E2E_TEST_EMAIL=e2e-test@10xcards.com
E2E_TEST_PASSWORD=TestPassword123!
```

**Important**: The `test:e2e:setup` script automatically copies `.env.test` to `.env` before running tests to ensure the dev server uses cloud credentials.

## Project Structure

```
src/tests/
├── README.md                    # This file
├── fixtures.ts                  # Test fixtures and test data
├── playwright.config.ts         # Playwright configuration
├── teardown.ts                  # Test cleanup script
├── auth.spec.ts                 # Authentication tests (3 tests)
├── manual-flashcards.spec.ts    # Manual flashcard tests (5 tests)
└── pages/                       # Page Object Models
    ├── LoginPage.ts
    ├── RegisterPage.ts
    ├── GeneratePage.ts
    └── FlashcardsPage.ts
```

## Page Object Model Pattern

All page interactions are encapsulated in Page Object classes:

```typescript
import { test } from './fixtures';

test('example test', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  await loginPage.expectRedirectToGenerate();
});
```

## Test Fixtures

Custom fixtures available in tests:

- `loginPage` - Login page interactions
- `registerPage` - Registration page interactions
- `generatePage` - Generate/create flashcards page
- `flashcardsPage` - My Flashcards page
- `authenticatedPage` - Pre-authenticated page instance
- `testData` - Test user and flashcard data

## Critical Implementation Detail

### Playwright `.fill()` vs `.pressSequentially()`

When testing React controlled components, use `.pressSequentially()` instead of `.fill()`:

```typescript
// ❌ WRONG - Doesn't trigger React onChange events
async login(email: string, password: string) {
  await this.emailInput.fill(email);
  await this.passwordInput.fill(password);
  await this.submitButton.click();
}

// ✅ CORRECT - Triggers React onChange events
async login(email: string, password: string) {
  await this.emailInput.click();
  await this.emailInput.pressSequentially(email, { delay: 50 });

  await this.passwordInput.click();
  await this.passwordInput.pressSequentially(password, { delay: 50 });

  await this.submitButton.click();
}
```

**Why**: Playwright's `.fill()` directly sets DOM values but doesn't trigger React's `onChange` handlers, leaving React component state empty even though DOM shows values.

## Test Data Management

### Setup
Test user is created manually in Supabase Dashboard with credentials in `.env.test`.

### Teardown
Run cleanup after tests:

```bash
npm run test:e2e:teardown
```

This deletes all flashcards, generations, and error logs created during tests while preserving the test user account.

## Data Test IDs

All interactive elements have `data-testid` attributes for stable selectors:

```typescript
// Login Form
data-testid="login-email-input"
data-testid="login-password-input"
data-testid="login-submit-button"
data-testid="login-error-message"

// Register Form
data-testid="register-email-input"
data-testid="register-password-input"
data-testid="register-confirm-password-input"
data-testid="register-submit-button"

// Manual Flashcard Form
data-testid="flashcard-front-{index}"
data-testid="flashcard-back-{index}"
data-testid="add-card-button"
data-testid="save-flashcards-button"

// Flashcard List
data-testid="flashcard-item-{id}"
data-testid="edit-flashcard-{id}"
data-testid="delete-flashcard-{id}"
```

## Test Results

### Authentication Tests (3/3 passing) ✅

1. **Login with valid credentials**
   - Navigates to login page
   - Fills credentials using test user
   - Expects redirect to /generate

2. **Error with invalid credentials**
   - Attempts login with wrong password
   - Verifies error message appears

3. **HTML5 validation with empty fields**
   - Clicks submit without filling fields
   - Verifies required attributes on inputs

### Manual Flashcard Tests (5 tests - out of scope)

These tests timeout waiting for form elements and are outside the minimal E2E scope.

## Debugging Tests

### Run in debug mode
```bash
npm run test:e2e:debug
```

### View test artifacts
After test failures, check:
- `playwright-report/` - HTML test report
- Screenshots in test results
- Video recordings of failed tests
- Browser console logs

### Common Issues

1. **Timeout errors**: Increase timeout in `playwright.config.ts`
2. **Element not found**: Verify `data-testid` attributes in components
3. **Wrong environment**: Ensure `.env` was copied from `.env.test`
4. **React state not updating**: Use `.pressSequentially()` instead of `.fill()`

## CI/CD Integration

Tests are configured for CI with:
- 2 retries on failure
- Automatic artifacts upload
- Parallel execution disabled (for now)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
