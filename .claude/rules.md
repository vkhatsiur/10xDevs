# 10xCards - AI Rules

## Project Context

This is a web application for AI-powered flashcard generation built with Astro, React, TypeScript, Tailwind CSS, and Supabase. Always consider these technologies when generating code.

## General Principles

- Always respond in English for code, comments, and commit messages
- Focus on clean, maintainable, and type-safe code
- Follow modern JavaScript/TypeScript best practices
- Prioritize simplicity over complexity
- Write self-documenting code with clear names

## TypeScript

- Use TypeScript for all code files
- Prefer `interface` over `type` for object shapes
- Always provide explicit types for function parameters and return values
- Use strict type checking (already configured)
- Avoid `any` - use `unknown` or specific types
- Use type guards when narrowing types
- Leverage TypeScript utility types when appropriate

## React Components

- Always use functional components with hooks
- Never use class components
- Use React 19 features and best practices
- Component file structure (top to bottom):
  1. Imports
  2. Type definitions/interfaces
  3. Main component
  4. Sub-components (if any)
  5. Helper functions
  6. Static content/constants

### Component Example

```tsx
import { useState } from 'react';
import type { FC } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button onClick={onClick} className={variant === 'primary' ? 'btn-primary' : 'btn-secondary'}>
      {label}
    </button>
  );
};
```

## Astro

- Use `.astro` files for pages and layouts
- Keep Astro components simple and focused
- Use React components for interactive UI (islands architecture)
- Import CSS in layouts: `import '../styles/global.css'`
- Leverage Astro's static generation capabilities

## Styling

- Use Tailwind CSS for all styling
- Never write custom CSS unless absolutely necessary
- Use Tailwind utility classes directly in JSX/TSX
- Follow mobile-first responsive design
- Use Shadcn/ui components when available

### Tailwind Best Practices

- Group related utilities: `className="flex items-center gap-2"`
- Use semantic spacing: `p-4`, `mt-6`, `space-y-4`
- Leverage Tailwind's color system: `bg-blue-500`, `text-gray-700`
- Use hover/focus states: `hover:bg-blue-600`, `focus:ring-2`

## Shadcn/ui Components

- Always use Shadcn/ui components when available (Button, Card, Input, etc.)
- Install new components with: `npx shadcn@latest add [component-name]`
- Customize components by editing generated files in `src/components/ui/`
- Never import Shadcn/ui from npm - components are copied to project
- Follow Radix UI patterns for accessibility

## State Management

- Use React hooks (`useState`, `useEffect`, `useContext`) for local state
- Consider Zustand for global state (install when needed)
- Keep state as local as possible
- Avoid prop drilling - use Context for deeply nested components

## Form Handling

- Use `react-hook-form` for complex forms (install when needed)
- Use Zod for schema validation (install when needed)
- Validate on both client and server
- Provide clear error messages

## API Routes

- Place API routes in `src/pages/api/`
- Use TypeScript for request/response types
- Always validate input data
- Return proper HTTP status codes
- Handle errors gracefully with try/catch
- Use consistent response format:

```typescript
// Success
return new Response(JSON.stringify({ data: result }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

// Error
return new Response(JSON.stringify({ error: 'Error message' }), {
  status: 400,
  headers: { 'Content-Type': 'application/json' },
});
```

## Database (Supabase)

- Use Supabase client for all database operations
- Generate TypeScript types from database: `supabase gen types typescript --local`
- Use Row Level Security (RLS) policies
- Write migrations for schema changes
- Place migrations in `supabase/migrations/`
- Use meaningful migration names: `YYYYMMDDHHMMSS_description.sql`

## File Organization

```
src/
├── components/
│   ├── ui/              # Shadcn/ui components
│   └── [feature]/       # Feature-specific components
├── layouts/
│   └── Layout.astro
├── pages/
│   ├── index.astro
│   └── api/             # API routes
├── styles/
│   └── global.css
├── db/
│   ├── supabase.client.ts
│   └── types.ts         # Generated database types
└── types/
    └── index.ts         # Shared type definitions
```

## Naming Conventions

- **Files**:
  - Components: `PascalCase.tsx` or `PascalCase.astro`
  - Utilities: `camelCase.ts`
  - API routes: `kebab-case.ts`
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces/Types**: `PascalCase`
- **Functions**: `camelCase`, use verbs (e.g., `handleClick`, `fetchData`)

## Error Handling

- Always use try/catch for async operations
- Provide user-friendly error messages
- Log errors for debugging (use console.error in development)
- Never expose sensitive information in error messages
- Handle loading and error states in UI

## Comments

- Write self-documenting code first
- Add comments only when code logic is not obvious
- Use JSDoc for exported functions:

```typescript
/**
 * Generates flashcards from provided text using AI
 * @param text - Source text to generate flashcards from
 * @returns Array of generated flashcards
 */
export async function generateFlashcards(text: string): Promise<Flashcard[]> {
  // Implementation
}
```

## Testing

- Write tests for critical business logic (when adding test framework)
- Test components with user-centric approach
- Mock external dependencies (API calls, database)

## Git Commits

- Use conventional commits format
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`
- Examples:
  - `feat: add flashcard generation endpoint`
  - `fix: correct validation in input form`
  - `chore: update dependencies`
- Always end with: `🤖 Generated with Claude Code`

## Performance

- Minimize client-side JavaScript (use Astro's static generation)
- Lazy load components when appropriate
- Optimize images (use Astro's image optimization)
- Use React.memo() for expensive components
- Avoid unnecessary re-renders

## Accessibility

- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Use ARIA labels when necessary
- Maintain proper heading hierarchy
- Ensure sufficient color contrast

## Security

- Never commit `.env` files
- Validate all user input
- Sanitize data before database operations
- Use environment variables for sensitive data
- Implement CSRF protection (built into Astro)
- Set appropriate CORS policies

## AI Integration (OpenRouter)

- Store API key in environment variable: `OPENROUTER_API_KEY`
- Use structured outputs (JSON schema) for flashcard generation
- Handle API rate limits and errors gracefully
- Implement retry logic for failed requests
- Use cost-effective models (GPT-4o-mini, Gemini Flash)

## DON'Ts

- ❌ Don't use class components in React
- ❌ Don't write inline styles (use Tailwind)
- ❌ Don't use `var` (use `const` or `let`)
- ❌ Don't ignore TypeScript errors
- ❌ Don't commit commented-out code
- ❌ Don't use `console.log` in production
- ❌ Don't create unnecessary abstractions
- ❌ Don't use `any` type without good reason

## DO's

- ✅ Use async/await over promises
- ✅ Use optional chaining: `user?.name`
- ✅ Use nullish coalescing: `value ?? default`
- ✅ Destructure props and objects
- ✅ Use template literals for strings
- ✅ Keep functions small and focused
- ✅ Write tests for critical paths
- ✅ Use meaningful variable names

## Example Component (Full)

```tsx
import { useState } from 'react';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardListProps {
  flashcards: Flashcard[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const FlashcardList: FC<FlashcardListProps> = ({ flashcards, onDelete, onEdit }) => {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const handleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No flashcards yet. Generate some to get started!
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flashcards.map((card) => (
        <Card key={card.id} className="p-4">
          <div
            onClick={() => handleFlip(card.id)}
            className="cursor-pointer min-h-[100px] flex items-center justify-center mb-4"
          >
            {flipped[card.id] ? (
              <p className="text-sm">{card.answer}</p>
            ) : (
              <p className="font-semibold">{card.question}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onEdit(card.id)} variant="outline" size="sm">
              Edit
            </Button>
            <Button onClick={() => onDelete(card.id)} variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

---

**Remember**: These rules ensure consistency, quality, and maintainability. Follow them unless there's a compelling reason not to.
