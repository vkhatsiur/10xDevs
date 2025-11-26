# 10xCards - Product Requirements Document (PRD)

## 1. Project Overview

**Name:** 10xCards
**Version:** MVP 1.0
**Date:** 2025-11-13
**Author:** Vasyl Khatsiur

### Elevator Pitch

10xCards is a web application for automatic AI-powered flashcard generation. Users can import text, notes, or documents, and AI instantly creates high-quality cards for effective spaced repetition learning.

---

## 2. Problem Statement

### Core Problem

**Spaced repetition (flashcard systems)** is one of the most effective learning methods, backed by scientific research. However, creating flashcards manually:

- Takes enormous time (hours for one textbook chapter)
- Requires analyzing material and extracting key information
- Needs formulating questions and answers
- Is the main barrier to using spaced repetition
- Discourages potential users due to tedious work

### Target Audience

- Students (universities, schools)
- Developers learning new technologies
- Professionals preparing for certifications
- Anyone using active learning methods

---

## 3. Solution

### Core Value Proposition

10xCards leverages Generative AI capabilities to automatically create high-quality flashcards from any text, reducing card creation time from hours to minutes.

### Key Benefits

- **Speed:** Card generation in seconds instead of hours
- **Quality:** AI creates well-formulated questions and answers
- **Convenience:** Simple text import and instant generation
- **Efficiency:** Focus on learning, not preparation

---

## 4. MVP Functional Requirements

### Must Have (Critical for MVP)

#### 4.1 Content Import

- **FR-1.1:** User can enter/paste text through text field
- **FR-1.2:** Support for text in any language
- **FR-1.3:** Basic input validation (minimum length, maximum size)
- **FR-1.4:** Character count display

#### 4.2 AI Flashcard Generation

- **FR-2.1:** LLM integration via OpenRouter
- **FR-2.2:** Structured flashcard generation (question + answer)
- **FR-2.3:** Structured output in JSON format
- **FR-2.4:** Generation error handling
- **FR-2.5:** Loading state during generation
- **FR-2.6:** Success message after generation

#### 4.3 Flashcard Review

- **FR-3.1:** Display list of generated cards
- **FR-3.2:** Show question and answer for each card
- **FR-3.3:** Visual separation of question and answer
- **FR-3.4:** Responsive design (mobile-friendly)

#### 4.4 Flashcard Management

- **FR-4.1:** Save generated cards to database
- **FR-4.2:** Edit existing cards (questions and answers)
- **FR-4.3:** Delete cards
- **FR-4.4:** View generation history

#### 4.5 Data Persistence

- **FR-5.1:** PostgreSQL database via Supabase
- **FR-5.2:** Tables: users, generations, flashcards, study_sessions
- **FR-5.3:** Migrations for schema versioning
- **FR-5.4:** Basic indexes for performance

### Should Have (Nice to have, but not critical)

#### 4.6 Additional Features

- **FR-6.1:** Export cards in JSON/CSV format
- **FR-6.2:** Preview before saving
- **FR-6.3:** Bulk operations (delete multiple cards)

### Won't Have (NOT in MVP - leave for later)

- ❌ User authentication (Module 3)
- ❌ Spaced repetition algorithm
- ❌ Progress tracking and learning statistics
- ❌ Multiple card decks
- ❌ File upload (PDF, DOCX, etc.)
- ❌ Sharing cards with others
- ❌ Mobile application
- ❌ Offline mode
- ❌ Gamification (streaks, badges, etc.)

---

## 5. Non-Functional Requirements

### 5.1 Performance

- Card generation must complete within 10 seconds
- Card list display must be instant (<500ms)
- Responsive UI without delays

### 5.2 Usability

- Intuitive interface without need for instructions
- Clear error messages
- Loading states for all async operations

### 5.3 Reliability

- Graceful API error handling
- State preservation on reload
- Data validation on client and server

### 5.4 Scalability (for future)

- Architecture must allow adding new features
- Modular code structure
- Ready for authentication integration

---

## 6. User Stories

### US-1: Generate Cards from Text

**As** a student,
**I want to** paste text from a textbook,
**So that** I can quickly get flashcards for learning.

**Acceptance Criteria:**

- User can paste text into form
- After clicking "Generate" system creates cards
- Cards are displayed on screen
- User can review all generated cards

### US-2: Edit Cards

**As** a user,
**I want to** edit generated cards,
**So that** I can correct or improve wording.

**Acceptance Criteria:**

- User can click on card to edit
- Can change question and answer
- Changes are saved to database
- UI updates after saving

### US-3: Delete Unnecessary Cards

**As** a user,
**I want to** delete cards I don't need,
**So that** I keep only relevant ones.

**Acceptance Criteria:**

- Delete button available for each card
- Confirmation before deletion
- Card is removed from database and UI

### US-4: View Generation History

**As** a user,
**I want to** see all my previous generations,
**So that** I can return to them later.

**Acceptance Criteria:**

- List of all generations with dates
- Ability to view cards from each generation
- Sorting by date (newest first)

---

## 7. Tech Stack

### Frontend

- **Framework:** Astro 5 (for speed and minimal JS)
- **UI Library:** React 19 (for interactive components)
- **Language:** TypeScript 5 (for type safety)
- **Styling:** Tailwind CSS 4 (utility-first CSS)
- **Components:** Shadcn/ui (ready-to-use components)

### Backend

- **API:** Astro API routes (endpoints)
- **Database:** PostgreSQL via Supabase
- **ORM/Client:** Supabase JS Client
- **Migrations:** Supabase migrations

### AI Integration

- **Provider:** OpenRouter (universal API for LLMs)
- **Model:** GPT-4o-mini or Gemini Flash (for budget)
- **Format:** Structured outputs (JSON schema)

### Infrastructure

- **Version Control:** GitHub
- **Hosting:** TBD (Module 3 - Cloudflare/Vercel)
- **CI/CD:** GitHub Actions (Module 3)

### Development Tools

- **AI Assistant:** Claude Code / Cursor / Windsurf
- **Linting:** ESLint
- **Formatting:** Prettier
- **Package Manager:** npm/pnpm

---

## 8. Data Architecture

### Database Schema (high level)

#### Table: users

```
- id (uuid, primary key)
- email (string)
- created_at (timestamp)
```

#### Table: generations

```
- id (uuid, primary key)
- user_id (uuid, foreign key → users)
- source_text (text)
- created_at (timestamp)
```

#### Table: flashcards

```
- id (uuid, primary key)
- generation_id (uuid, foreign key → generations)
- question (text)
- answer (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Table: study_sessions (for future)

```
- id (uuid, primary key)
- user_id (uuid, foreign key → users)
- flashcard_id (uuid, foreign key → flashcards)
- studied_at (timestamp)
```

---

## 9. API Endpoints

### POST /api/generations

Create new card generation from text

**Request:**

```json
{
  "userId": "uuid",
  "content": "string (source text)"
}
```

**Response:**

```json
{
  "generationId": "uuid",
  "flashcards": [
    {
      "id": "uuid",
      "question": "string",
      "answer": "string"
    }
  ]
}
```

### GET /api/generations/:userId

Get all user generations

### GET /api/flashcards/:generationId

Get all flashcards for generation

### PUT /api/flashcards/:id

Update flashcard

### DELETE /api/flashcards/:id

Delete flashcard

---

## 10. UI/UX Concept

### Main Page

- Large text input field
- Prominent "Generate Flashcards" button
- Results section below

### Generation Results

- Card layout for each flashcard
- Flip animation for question/answer view
- Action buttons (Edit, Delete)

### Generation History

- List with preview
- Generation dates
- Quick access to cards

### Design System

- Inspiration: Linear, Vercel (clean, minimalist)
- Shadcn/ui components for consistency
- Tailwind for customization

---

## 11. Success Criteria

### MVP is considered successful if:

- ✅ User can paste text and generate cards
- ✅ Generated cards are saved to database
- ✅ User can view, edit, and delete cards
- ✅ UI is responsive and works on mobile
- ✅ No critical bugs
- ✅ Meets 10xDevs certification criteria

---

## 12. Timeline and Phases

### Module 2 (Foundation)

- **Week 1:** Database schema, migrations, Supabase setup
- **Week 2:** API endpoints for CRUD operations
- **Week 3:** UI components with Shadcn/ui
- **Week 4:** OpenRouter integration, AI generation
- **Week 5:** Polish, bug fixes, testing

### Module 3 (Production) - optional

- Authentication with Supabase Auth
- Tests (Vitest + Playwright)
- CI/CD with GitHub Actions
- Production deployment

---

## 13. Risks and Constraints

### Technical Risks

- **AI costs:** May be expensive with many users → use cheap models
- **AI quality:** Card quality depends on model → test different models
- **Rate limits:** OpenRouter has limits → add error handling

### Scope Risks

- **Feature creep:** Temptation to add many features → stick to MVP scope
- **Perfectionism:** Desire to make everything perfect → focus on working MVP

---

## 14. Next Steps After MVP

### Version 2.0 Features

- Supabase Auth integration
- Spaced repetition algorithm
- Progress tracking and analytics
- Multiple decks organization
- File upload (PDF, DOCX)
- Export functionality
- Social features (sharing)
- Mobile app

---

## 15. Additional Information

### Useful Links

- 10xRules.ai Prompt Library: https://10xrules.ai/prompts
- Supabase Docs: https://supabase.com/docs
- OpenRouter Docs: https://openrouter.ai/docs
- Shadcn/ui: https://ui.shadcn.com
- Astro Docs: https://astro.build

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Status:** Approved for development
