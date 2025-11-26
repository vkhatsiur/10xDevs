# Production Supabase Setup Guide

This guide walks you through setting up a production Supabase project for 10xCards.

## Overview

You need **two separate Supabase projects**:

- **Development** - Local Supabase or cloud project for development
- **E2E Testing** - Cloud project for E2E tests (already configured)
- **Production** - Cloud project for production deployment ⭐ (this guide)

## Step 1: Create Production Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Fill in details:
   - **Name**: `10xcards-production` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose closest to your users (e.g., `Europe (Frankfurt)`)
   - **Pricing Plan**: Free tier is sufficient for MVP
4. Click **Create new project**
5. Wait 2-3 minutes for project to be provisioned

## Step 2: Get Production Credentials

Once project is created:

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):

```bash
# Project URL
URL: https://your-production-project.supabase.co

# API Keys
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI...
```

3. Go to **Settings** → **Database**
4. Copy **Connection string** (optional, for direct database access)

## Step 3: Run Database Migrations

You need to apply the same database schema to production:

### Option A: Using Supabase CLI (Recommended)

```bash
# Login to Supabase
npx supabase login

# Link to production project
npx supabase link --project-ref your-production-project-ref

# Push migrations to production
npx supabase db push
```

### Option B: Using SQL Editor (Manual)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New query**
3. Copy content from `supabase/migrations/` files in order:
   - `20241113000000_initial_schema.sql`
   - Any other migration files
4. Execute each migration
5. Verify tables exist in **Table Editor**

### Option C: Using Combined Migration File

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New query**
3. Copy entire content from `supabase/cloud-migration.sql`
4. Click **Run**
5. Verify success (should see "Success. No rows returned")

## Step 4: Enable Row Level Security (RLS)

RLS policies are created automatically by migrations, but verify they're active:

1. Go to **Authentication** → **Policies**
2. Check that tables have policies:
   - `flashcards` - 3 policies (SELECT, INSERT, DELETE for own records)
   - `generations` - 3 policies (SELECT, INSERT, DELETE for own records)
   - `generation_error_logs` - 2 policies (SELECT, INSERT for own records)
3. Enable RLS on all tables if not already enabled

## Step 5: Configure Authentication

### Email Auth (Default)

Email/password authentication is enabled by default.

1. Go to **Authentication** → **Providers**
2. Verify **Email** is enabled
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation, reset password emails

### Email Settings (Important for Production!)

1. Go to **Settings** → **Auth**
2. Configure **SMTP Settings** for custom email:
   - **Enable Custom SMTP**: Yes
   - **Sender Email**: noreply@yourdomain.com
   - **Sender Name**: 10xCards
   - **Host**: Your SMTP server (e.g., smtp.gmail.com)
   - **Port**: 587 or 465
   - **Username**: Your email
   - **Password**: App password

   OR use a service like:
   - [SendGrid](https://sendgrid.com/)
   - [Mailgun](https://www.mailgun.com/)
   - [AWS SES](https://aws.amazon.com/ses/)

**Note**: Without custom SMTP, emails are sent from Supabase's servers (limited to 3 per hour on free tier).

### URL Configuration

1. Go to **Settings** → **Auth**
2. Set **Site URL**: `https://your-domain.com` (or Cloudflare Pages URL)
3. Add **Redirect URLs**:
   - `https://your-domain.com/**`
   - `https://*.pages.dev/**` (for Cloudflare preview deployments)

## Step 6: Create Production Environment Variables

Create a `.env.production` file locally (DO NOT COMMIT):

```bash
# Production Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key_here

# OpenRouter API Key (same as development)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## Step 7: Set Environment Variables in Cloudflare

You'll add these in Cloudflare Pages dashboard (covered in deployment guide):

| Variable Name               | Value                       | Required |
| --------------------------- | --------------------------- | -------- |
| `PUBLIC_SUPABASE_URL`       | Production Supabase URL     | Yes      |
| `PUBLIC_SUPABASE_ANON_KEY`  | Production anon key         | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key | Yes      |
| `OPENROUTER_API_KEY`        | Your OpenRouter API key     | Yes      |

## Step 8: Test Production Database

Test that everything works:

```bash
# Create .env.production with production credentials
# Then build with production env
npm run build

# Test locally with production database
npm run preview
```

1. Try to register a new user
2. Try to login
3. Try to generate flashcards
4. Verify data appears in Supabase Dashboard → Table Editor

## Step 9: Security Checklist

Before going live:

- [ ] RLS policies enabled on all tables
- [ ] Email confirmation enabled (Settings → Auth)
- [ ] Custom SMTP configured (to avoid rate limits)
- [ ] Site URL and Redirect URLs configured
- [ ] Service role key kept secret (never expose to frontend)
- [ ] Database backups configured (Settings → Database → Backups)
- [ ] Rate limiting considered (Settings → Auth)

## Step 10: Monitoring & Maintenance

### Database Monitoring

1. Go to **Reports** → **Database**
2. Monitor:
   - Connection count
   - Database size
   - Query performance

### Auth Monitoring

1. Go to **Authentication** → **Users**
2. Monitor:
   - User signups
   - Failed login attempts
   - Email confirmations

### Set Up Alerts (Optional)

1. Go to **Settings** → **Integrations**
2. Configure webhooks for:
   - Database errors
   - Auth events
   - Resource usage alerts

## Troubleshooting

### Migration Fails

**Error**: Foreign key constraint violation

**Solution**: Run migrations in correct order, starting with initial schema

### RLS Blocks All Queries

**Error**: `new row violates row-level security policy`

**Solution**: Verify `auth.uid()` returns correct user ID in RLS policies

### Email Confirmation Not Sent

**Error**: Users don't receive confirmation emails

**Solution**:

1. Check SMTP settings (Settings → Auth)
2. Verify email templates are configured
3. Check spam folder
4. Use custom SMTP provider

### Rate Limiting Issues

**Error**: Too many requests

**Solution**:

1. Increase rate limits in Settings → Auth
2. Implement client-side rate limiting
3. Add Cloudflare rate limiting rules

## Production vs Development Differences

| Feature     | Development    | Production         |
| ----------- | -------------- | ------------------ |
| Database    | Local Supabase | Cloud Supabase     |
| Users       | Test users     | Real users         |
| Emails      | Console logs   | Real SMTP          |
| Backups     | Manual         | Automated          |
| Monitoring  | None           | Dashboard + Alerts |
| Rate Limits | Unlimited      | Enforced           |

## Next Steps

After production Supabase is configured:

1. ✅ Database schema migrated
2. ✅ Authentication configured
3. ✅ RLS policies enabled
4. ✅ Environment variables prepared
5. ➡️ Proceed to Cloudflare Pages deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Cloudflare Pages deployment instructions.

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)
