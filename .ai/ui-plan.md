# UI Architecture for 10xCards

## 1. UI Structure Overview

The user interface is built around the flashcard generation view, which will be the main focus for Module 2. The UI structure includes authentication views (Module 3), flashcard generation view, flashcard list view with edit modal, user dashboard, and review session view. The entire UI uses responsive design based on Tailwind CSS v4, ready-made components from shadcn/ui, and React.

## 2. List of Views

### Module 2 MVP Scope (Current Focus)

- **Flashcard Generation View**
  - **Path:** `/generate`
  - **Main Goal:** Allows users to generate AI flashcard proposals and review them (accept, edit, or reject).
  - **Key Information:** Text input field, list of AI-generated flashcard proposals, accept/edit/reject buttons for each card.
  - **Key Components:** Text input component, "Generate Flashcards" button, flashcard list, action buttons (save all, save accepted), loading indicator (skeleton), error messages.
  - **UX, Accessibility & Security:** Intuitive form, text length validation (1000-10000 characters), responsiveness, clear messages and inline error notifications.
  - **Current Implementation:** Uses test user ID `00000000-0000-0000-0000-000000000001` for MVP.
  - **API Integration:**
    - POST `/api/generations` - Generate flashcard proposals
    - POST `/api/flashcards` - Save flashcards in batch
    - GET `/api/flashcards` - Retrieve saved flashcards

- **Flashcard List View (My Flashcards)**
  - **Path:** `/flashcards`
  - **Main Goal:** Browse, edit, and delete saved flashcards.
  - **Key Information:** List of saved flashcards with question and answer information.
  - **Key Components:** List items, edit modal component, delete buttons (with confirmation).
  - **UX, Accessibility & Security:** Clear list layout, keyboard accessibility for modifications, delete confirmations.
  - **Current Implementation:** Uses test user ID for MVP.

- **Flashcard Edit Modal**
  - **Path:** Displayed above flashcard list view
  - **Main Goal:** Enable editing flashcards with data validation without real-time saving.
  - **Key Information:** Flashcard edit form, "Front" and "Back" fields, validation messages.
  - **Key Components:** Modal with form, "Save" and "Cancel" buttons.
  - **UX, Accessibility & Security:** Intuitive modal, screen reader accessibility, client-side validation before sending changes.

### Module 3+ (Future Scope)

- **Authentication Screens**
  - **Path:** `/login` and `/register`
  - **Main Goal:** Enable user login and registration.
  - **Key Information:** Forms with email and password fields; authentication error messages.
  - **Key Components:** Login/registration form, validation component, buttons, error messages.
  - **UX, Accessibility & Security:** Simple form, clear error messages, keyboard support, JWT security.
  - **Status:** Not implemented in Module 2 MVP - using test user ID.

- **User Dashboard**
  - **Path:** `/profile`
  - **Main Goal:** Manage user account information and settings.
  - **Key Information:** User data, profile edit options, logout button.
  - **Key Components:** Profile edit form, action buttons.
  - **UX, Accessibility & Security:** Secure logout, easy access to settings, simple and clear interface.
  - **Status:** Future implementation.

- **Review Session View**
  - **Path:** `/session`
  - **Main Goal:** Enable learning session with flashcards according to spaced repetition algorithm.
  - **Key Information:** Display front of flashcard, button to reveal back, rating mechanism.
  - **Key Components:** Flashcard display component, interaction buttons (e.g., "Show Answer", "Rating"), session counter.
  - **UX, Accessibility & Security:** Minimalist interface focused on learning, responsiveness, clear high-contrast buttons, intuitive system for navigating between flashcards.
  - **Status:** Future implementation.

## 3. User Journey Map (Module 2 MVP)

1. User accesses the application and lands on the flashcard generation view.
2. User enters text for flashcard generation and initiates the generation process.
3. API returns flashcard proposals, which are presented in the generation view.
4. User reviews proposals and decides which flashcards to accept, edit, or reject (optionally opens edit modal).
5. User confirms selected flashcards and performs batch save via API interaction.
6. User navigates to "My Flashcards" view, where they can browse, edit, or delete flashcards.
7. In case of errors (e.g., validation, API issues), user receives inline messages.

## 4. Layout and Navigation Structure

### Module 2 MVP Navigation

- **Main Navigation:** Available as top menu in page layout.
- **Navigation Elements:** Links to views: "Generate Flashcards", "My Flashcards"
- **Responsiveness:** In mobile view, navigation transforms into hamburger menu, enabling easy access to other views.
- **Flow:** Navigation enables seamless transitions between views, maintaining user context and session data.

### Future Navigation (Module 3+)

- Will include: "Review Session", "Profile", and logout button
- Authentication required for access

## 5. Key Components

### Module 2 MVP Components (Current Focus)

- **Flashcard Generation Component:** With text field and button launching generation process, with loading indicator.
- **Flashcard List:** Interactive component displaying list of flashcards with edit and delete options.
- **Edit Modal:** Component enabling flashcard editing with data validation before confirmation.
- **Toast Notifications:** Component for displaying success and error messages.
- **Navigation Menu:** Navigation elements facilitating movement between views.

### shadcn/ui Components to Install

Based on the implementation plan, we'll need:

- `button` - For all interactive buttons
- `textarea` - For text input area
- `card` - For flashcard proposals display
- `skeleton` - For loading states
- `toast` - For notifications
- `dialog` - For edit modal
- `badge` - For source indicators (ai-full, ai-edited, manual)

### Future Components (Module 3+)

- **Authentication Forms:** Login and registration components with validation support.
- **Review Session Component:** Interactive layout for displaying flashcards during learning session with rating mechanism.

## 6. Tech Stack

- **Framework:** Astro 5.1 with SSR enabled
- **UI Library:** React 18 for interactive components
- **Component Library:** shadcn/ui (new-york style, slate color)
- **Styling:** Tailwind CSS v4 (CSS-based configuration)
- **Type Safety:** TypeScript with path aliases (`@/*`)
- **Backend:** Supabase for database and API
- **AI Service:** OpenRouter API (using free model: deepseek/deepseek-chat-v3.1:free)

## 7. Design Principles

- **Minimalist Interface:** Focus on core functionality without unnecessary elements
- **Responsive Design:** Mobile-first approach with Tailwind breakpoints
- **Accessibility:** WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- **Performance:** Skeleton loaders for perceived performance, optimistic UI updates
- **Error Handling:** Clear, actionable error messages with recovery options
- **Validation:** Client-side validation with immediate feedback

## 8. Implementation Priorities (Module 2)

### Phase 1: Flashcard Generation View (Lesson 2x5)

1. Initialize shadcn/ui ✅
2. Install required components
3. Create FlashcardGenerator view
4. Implement text input with validation
5. Connect to POST /api/generations endpoint
6. Display proposals with loading states
7. Implement accept/edit/reject functionality
8. Implement batch save to POST /api/flashcards

### Phase 2: Flashcard List View (Future)

1. Create FlashcardList view
2. Connect to GET /api/flashcards endpoint
3. Implement edit modal
4. Implement delete functionality with confirmation

### Phase 3: Polish and Testing (Future)

1. Add toast notifications
2. Improve error handling
3. Test responsive design
4. Accessibility audit
5. Performance optimization

## 9. Notes

- **Module 2 Scope:** Focus on flashcard generation and basic CRUD operations
- **Test User ID:** Using `00000000-0000-0000-0000-000000000001` throughout Module 2
- **No Authentication:** Auth will be implemented in Module 3
- **Free AI Model:** Using DeepSeek free model (20 req/min, 200 req/day limits)
- **API Already Working:** All backend endpoints are tested and functional
