# GitHub Actions Setup

This document explains how to configure GitHub Actions workflows for CI/CD.

## Workflows Overview

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Checks performed:**
- Code linting (ESLint)
- Code formatting (Prettier)
- Type checking (Astro check)
- Unit tests (Vitest)
- Production build

**Artifacts:**
- Build output (`dist/`) - retained for 7 days

### 2. E2E Tests Workflow (`.github/workflows/e2e.yml`)

Runs on push/PR to `main` branch or manually via workflow_dispatch.

**Checks performed:**
- E2E tests with Playwright
- Automated test data cleanup

**Artifacts:**
- Test reports - retained for 14 days
- Test videos (on failure) - retained for 7 days

## Required GitHub Secrets

To enable E2E tests, configure the following secrets in your GitHub repository:

### Navigation
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Secrets to Add

#### For CI Workflow (Optional - uses placeholders if not set)

| Secret Name | Description | Example |
|------------|-------------|---------|
| `PUBLIC_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key | `eyJhbGciOiJIUzI1NiIsInR5cCI...` |
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-v1-...` |

#### For E2E Tests (Required)

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `E2E_SUPABASE_URL` | Cloud Supabase URL for E2E tests | `https://mjrgjqlndutyqycwutco.supabase.co` |
| `E2E_SUPABASE_ANON_KEY` | Cloud Supabase publishable key | `sb_publishable_...` |
| `E2E_SUPABASE_SERVICE_KEY` | Cloud Supabase service role key | `sb_secret_...` |
| `E2E_TEST_EMAIL` | Test user email | `e2e-test@10xcards.com` |
| `E2E_TEST_PASSWORD` | Test user password | `TestPassword123!` |
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-v1-...` |

### Where to Find These Values

**Cloud Supabase credentials** (for E2E tests):
- From your `.env.test` file in the project root
- Or from Supabase Dashboard → Project Settings → API

**OpenRouter API key**:
- From [OpenRouter Dashboard](https://openrouter.ai/keys)

**Test user credentials**:
- From your `.env.test` file
- Email: `e2e-test@10xcards.com`
- Password: `TestPassword123!`

## Quick Setup Commands

### Copy secrets from .env.test

You can copy values from your local `.env.test` file:

```bash
# View your .env.test file
cat .env.test

# Then manually add each secret to GitHub:
# Settings → Secrets and variables → Actions → New repository secret
```

## Manual Workflow Triggers

### Run E2E tests manually

1. Go to **Actions** tab in GitHub
2. Select **E2E Tests** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Troubleshooting

### CI Workflow Fails on Build

**Problem**: Build fails with missing environment variables

**Solution**: Add `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, and `OPENROUTER_API_KEY` secrets to GitHub

### E2E Tests Fail

**Problem**: E2E tests timeout or fail with authentication errors

**Solution**:
1. Verify all E2E secrets are configured correctly
2. Check that test user exists in cloud Supabase
3. Verify cloud Supabase database is migrated (see `supabase/cloud-migration.sql`)

### Workflow Doesn't Run

**Problem**: Push to main doesn't trigger workflow

**Solution**:
1. Check that workflow file is in `.github/workflows/` directory
2. Verify YAML syntax is valid
3. Check branch name matches trigger configuration

## Viewing Test Results

### CI Workflow Results

1. Go to **Actions** tab
2. Click on the workflow run
3. View step-by-step results
4. Download build artifacts if needed

### E2E Test Results

1. Go to **Actions** tab
2. Click on **E2E Tests** workflow run
3. Download **playwright-report** artifact
4. Unzip and open `index.html` in browser
5. If tests failed, download **playwright-videos** artifact

## Status Badges

Add status badges to your README.md:

```markdown
![CI](https://github.com/USERNAME/REPO/workflows/CI/badge.svg)
![E2E Tests](https://github.com/USERNAME/REPO/workflows/E2E%20Tests/badge.svg)
```

Replace `USERNAME` and `REPO` with your GitHub username and repository name.

## Local Testing

Before pushing, test workflows locally:

```bash
# Install act (GitHub Actions local runner)
# Windows (with Chocolatey)
choco install act-cli

# Run CI workflow locally
act push

# Run specific workflow
act -W .github/workflows/ci.yml
```

Note: Local testing has limitations and may not perfectly match GitHub Actions environment.

## Best Practices

1. **Never commit secrets** to `.env.test` or any file
2. **Use different Supabase projects** for development and E2E testing
3. **Review failed workflow logs** before re-running
4. **Keep workflows fast** - currently ~5-10 minutes total
5. **Monitor GitHub Actions usage** - free tier has limits

## Workflow Files

- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/e2e.yml` - E2E test pipeline
- `.github/SETUP.md` - This file

## Support

If workflows fail unexpectedly:
1. Check workflow logs in GitHub Actions
2. Verify all secrets are configured
3. Test locally first: `npm run test` and `npm run test:e2e`
4. Check [GitHub Actions status](https://www.githubstatus.com/)
