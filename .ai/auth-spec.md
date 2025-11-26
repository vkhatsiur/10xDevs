# Authentication Architecture Specification - 10xCards

**Version:** 1.0
**Date:** 2025-11-20
**Author:** Generated for 10xCards MVP
**Status:** Draft for Implementation

---

## 1. Executive Summary

This document describes the authentication architecture for 10xCards using **Supabase Auth**. The implementation will replace the current test user ID (`00000000-0000-0000-0000-000000000001`) with a fully functional authentication system.

### Key Decisions

- ✅ **Supabase Auth** instead of custom authentication (security, speed, maintenance)
- ✅ **Email/Password** authentication (no social login for MVP)
- ✅ **JWT-based sessions** with automatic token refresh
- ✅ **Row Level Security (RLS)** for data isolation
- ✅ **Server-side rendering** for auth pages (Astro SSR)

---

## 2. Updated User Stories

### US-005: User Registration

**As** a new user,
**I want to** create an account with email and password,
**So that** I can save my flashcards and access them later.

**Acceptance Criteria:**

- Registration page at `/register`
- Email and password fields with validation
- Password confirmation field
- Email verification (Supabase automatic)
- Redirect to login after successful registration
- Clear error messages for validation failures
- Password strength requirements (min 8 chars)

### US-006: User Login

**As** a registered user,
**I want to** log in with my credentials,
**So that** I can access my flashcards.

**Acceptance Criteria:**

- Login page at `/login`
- Email and password fields
- "Remember me" functionality (JWT stored in cookie)
- Redirect to `/generate` after successful login
- Clear error messages for failed login
- Link to password recovery
- Link to registration page

### US-007: User Logout

**As** a logged-in user,
**I want to** log out of the application,
**So that** my data is secure on shared devices.

**Acceptance Criteria:**

- Logout button in main navigation
- Clear session and JWT token
- Redirect to login page after logout
- No access to protected pages after logout

### US-008: Protected Routes

**As** the system,
**I want to** protect flashcard-related pages,
**So that** only authenticated users can access their data.

**Acceptance Criteria:**

- `/generate` requires authentication
- `/flashcards` requires authentication
- Unauthenticated users redirected to `/login`
- Session persistence across page reloads
- Automatic token refresh before expiration

### US-009: Password Recovery (Optional for MVP)

**As** a user who forgot password,
**I want to** reset my password via email,
**So that** I can regain access to my account.

**Acceptance Criteria:**

- Password reset page at `/reset-password`
- Email input for reset link
- Supabase sends reset email
- New password form after clicking reset link
- Redirect to login after successful reset

---

## 3. Technical Architecture

### 3.1 Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├──────> Login Page (/login)
       │        ┌────────────────┐
       │        │  LoginForm     │
       │        │  - Email       │
       │        │  - Password    │
       │        └────────┬───────┘
       │                 │
       │        POST /api/auth/login
       │                 │
       v                 v
┌──────────────────────────────┐
│   Astro API Route            │
│   /api/auth/login.ts         │
│                              │
│   1. Validate input          │
│   2. supabase.auth.signIn()  │
│   3. Set JWT cookie          │
│   4. Return session          │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│   Supabase Auth              │
│   - Verify credentials       │
│   - Generate JWT token       │
│   - Return user session      │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│   Middleware (Auth Check)    │
│   src/middleware.ts          │
│   - Read JWT from cookie     │
│   - Verify token validity    │
│   - Attach user to context   │
│   - Redirect if unauthorized │
└──────────┬───────────────────┘
           │
           v
     Protected Page
```

### 3.2 Database Schema Changes

**No changes required!** Supabase Auth uses its own `auth.users` table.

Our existing tables already have `user_id` UUID columns:

- ✅ `flashcards.user_id` → references auth.users(id)
- ✅ `generations.user_id` → references auth.users(id)
- ✅ `generation_error_logs.user_id` → references auth.users(id)

**Action Required:** Enable Row Level Security (RLS) policies.

### 3.3 Row Level Security (RLS) Policies

```sql
-- Enable RLS on flashcards table
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own flashcards
CREATE POLICY "Users can view own flashcards"
ON flashcards FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own flashcards
CREATE POLICY "Users can create own flashcards"
ON flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own flashcards
CREATE POLICY "Users can update own flashcards"
ON flashcards FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own flashcards
CREATE POLICY "Users can delete own flashcards"
ON flashcards FOR DELETE
USING (auth.uid() = user_id);

-- Same policies for generations table
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations"
ON generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Same for generation_error_logs
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own error logs"
ON generation_error_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own error logs"
ON generation_error_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 4. Implementation Plan

### Phase 1: Supabase Client Setup

**Files to Create:**

- `src/lib/supabase.client.ts` - Browser client
- `src/lib/supabase.server.ts` - Server client

**supabase.client.ts:**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**supabase.server.ts:**

```typescript
import { createClient } from '@supabase/supabase-js';

export function getServerSupabase(cookies: AstroCookies) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key) => cookies.get(key)?.value,
        setItem: (key, value) => cookies.set(key, value, { path: '/' }),
        removeItem: (key) => cookies.delete(key),
      },
    },
  });
}
```

### Phase 2: Authentication Middleware

**File:** `src/middleware.ts`

```typescript
import { defineMiddleware } from 'astro:middleware';
import { getServerSupabase } from './lib/supabase.server';

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = getServerSupabase(context.cookies);

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Attach user to context
  context.locals.user = session?.user ?? null;
  context.locals.supabase = supabase;

  // Protected routes
  const protectedPaths = ['/generate', '/flashcards', '/profile'];
  const isProtected = protectedPaths.some((path) => context.url.pathname.startsWith(path));

  // Redirect to login if not authenticated
  if (isProtected && !session) {
    return context.redirect('/login');
  }

  return next();
});
```

### Phase 3: API Endpoints

**Files to Create:**

- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/register.ts`
- `src/pages/api/auth/logout.ts`
- `src/pages/api/auth/reset-password.ts` (optional)

**login.ts:**

```typescript
import type { APIRoute } from 'astro';
import { getServerSupabase } from '../../../lib/supabase.server';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getServerSupabase(cookies);

  try {
    const { email, password } = await request.json();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
    });
  }
};
```

**register.ts:**

```typescript
import type { APIRoute } from 'astro';
import { getServerSupabase } from '../../../lib/supabase.server';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getServerSupabase(cookies);

  try {
    const { email, password } = await request.json();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        message: 'Check your email to confirm your account',
        user: data.user,
      }),
      {
        status: 201,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
    });
  }
};
```

**logout.ts:**

```typescript
import type { APIRoute } from 'astro';
import { getServerSupabase } from '../../../lib/supabase.server';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  const supabase = getServerSupabase(cookies);

  await supabase.auth.signOut();

  return new Response(JSON.stringify({ message: 'Logged out' }), {
    status: 200,
  });
};
```

### Phase 4: UI Components

**Files to Create:**

- `src/pages/login.astro`
- `src/pages/register.astro`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/layout/Navigation.tsx` (or update existing)

**shadcn Components Needed:**

- `input` - for email/password fields
- `label` - for form labels
- `button` - already installed ✅
- `form` - for form handling
- `alert` - already installed ✅

### Phase 5: Update Existing Code

**Files to Modify:**

1. **Remove test user ID from services:**
   - `src/lib/services/generation.service.ts`
   - `src/lib/services/flashcard.service.ts`
   - Replace `TEST_USER_ID` with `user_id` from context

2. **Update API endpoints:**
   - `src/pages/api/generations/index.ts`
   - `src/pages/api/flashcards/index.ts`
   - Get `user_id` from `context.locals.user.id`

3. **Add navigation:**
   - Update main layout with Login/Logout button
   - Show user email when logged in

### Phase 6: RLS Policies

**File:** Create new migration `db/migrations/003_enable_rls.sql`

Apply RLS policies (see section 3.3 above).

---

## 5. Security Considerations

### 5.1 Environment Variables

**Required in `.env`:**

```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:**

- ✅ Anon key is safe to expose (PUBLIC\_)
- ❌ Service role key must NEVER be exposed to client
- ✅ Use service role only in server-side code

### 5.2 Password Requirements

- Minimum 8 characters
- Supabase default validation (can be customized)
- No maximum length (Supabase handles hashing)

### 5.3 Session Management

- JWT stored in httpOnly cookies
- Automatic refresh before expiration
- Tokens expire after 1 hour (Supabase default)
- Refresh tokens valid for 30 days

### 5.4 CORS and Security Headers

Already handled by Supabase and Astro.

---

## 6. Testing Strategy

### Manual Testing Checklist

**Registration:**

- [ ] Can create account with valid email/password
- [ ] Cannot register with invalid email
- [ ] Cannot register with weak password
- [ ] Email confirmation received (if cloud Supabase)
- [ ] Redirected to login after registration

**Login:**

- [ ] Can log in with correct credentials
- [ ] Cannot log in with wrong password
- [ ] Cannot log in with non-existent email
- [ ] Error messages are clear
- [ ] Redirected to /generate after login

**Session:**

- [ ] Session persists across page reloads
- [ ] Can access protected routes when logged in
- [ ] Cannot access protected routes when logged out
- [ ] Redirected to login when accessing protected route

**Logout:**

- [ ] Can log out successfully
- [ ] Session cleared after logout
- [ ] Redirected to login page
- [ ] Cannot access protected routes after logout

**Data Isolation:**

- [ ] User A cannot see User B's flashcards
- [ ] User A cannot modify User B's data
- [ ] RLS policies working correctly

---

## 7. Rollout Plan

### Step-by-Step Implementation Order

1. ✅ Create auth-spec.md (this document)
2. 🔄 Install dependencies: `npm install @supabase/supabase-js`
3. 🔄 Create Supabase clients (browser + server)
4. 🔄 Create auth middleware
5. 🔄 Create auth API endpoints (login, register, logout)
6. 🔄 Install shadcn form components
7. 🔄 Create login page and form
8. 🔄 Create register page and form
9. 🔄 Update navigation with login/logout
10. 🔄 Remove test user ID from services
11. 🔄 Update API endpoints to use real user
12. 🔄 Create RLS migration
13. 🔄 Test all flows
14. 🔄 Fix bugs
15. ✅ Commit and deploy

### Estimated Time

- **Setup + API:** 2-3 hours
- **UI Components:** 2-3 hours
- **Integration + Testing:** 2-3 hours
- **Total:** 6-9 hours

---

## 8. Monitoring and Logs

### What to Monitor

- **Login failures** - track in `generation_error_logs` or create `auth_logs` table
- **Registration rate** - track new users
- **Session duration** - analyze user engagement

### Supabase Dashboard

Access auth logs at: `https://supabase.com/dashboard/project/{project_id}/auth/users`

---

## 9. Future Enhancements (Post-MVP)

### Not in Module 3, but possible later:

- **Social login** (Google, GitHub)
- **Two-factor authentication** (2FA)
- **Magic link authentication** (passwordless)
- **Account deletion**
- **Profile management page**
- **Change password functionality**
- **Remember device** (extended sessions)

---

## 10. References

### Documentation

- Supabase Auth: https://supabase.com/docs/guides/auth
- Astro SSR: https://docs.astro.build/en/guides/server-side-rendering/
- JWT: https://jwt.io/

### Course Resources

- 10xRules.ai Prompts: https://10xrules.ai/prompts
- Module 3, Lesson 3x1: Authentication Implementation

---

**Document Status:** Ready for Implementation
**Next Step:** Install @supabase/supabase-js and create Supabase clients
**Review Required:** Before starting implementation
