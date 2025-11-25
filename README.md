# 10xCards

AI-powered flashcard generation for effective learning through spaced repetition.

## 🎯 Project Overview

10xCards automatically generates high-quality flashcards from text using AI, reducing card creation time from hours to minutes.

### Problem
Creating flashcards manually is time-consuming and is the main barrier to using spaced repetition learning systems.

### Solution
Import text, notes, or documents → AI generates flashcards → Review and study effectively.

## 🚀 Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5
- **Styling:** Tailwind CSS 4, Shadcn/ui
- **Backend:** Astro API routes
- **Database:** PostgreSQL via Supabase
- **AI:** OpenRouter (GPT-4o-mini / Gemini Flash)

## 📋 MVP Features

- ✅ Text input for content
- ✅ AI-powered flashcard generation
- ✅ View, edit, and delete cards
- ✅ Generation history
- ✅ Responsive design
- ✅ User authentication (Supabase Auth)
- ✅ Unit tests (Vitest)
- ✅ E2E tests (Playwright)
- ✅ CI/CD (GitHub Actions)

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run unit tests
npm run test:watch        # Run in watch mode
npm run test:ui           # Run with UI
npm run test:coverage     # Run with coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:headed   # Run with visible browser
npm run test:e2e:debug    # Run in debug mode
npm run test:e2e:report   # View test report
npm run test:e2e:teardown # Clean up test data
```

See [tests/README.md](./tests/README.md) for detailed E2E testing documentation.

### CI/CD

Automated workflows run on every push:
- **CI**: Linting, type checking, unit tests, build verification
- **E2E**: Playwright tests on cloud Supabase

See [.github/SETUP.md](./.github/SETUP.md) for GitHub Actions configuration.

## 🧞 Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## 📖 Documentation

- [Product Requirements Document](./PRD.md)

## 🎓 Course Context

This project is built as part of the **10xDevs** course (Module 2) - AI-First MVP Bootstrap.

## 🔗 Links

- [10xRules.ai Prompt Library](https://10xrules.ai/prompts)
- [Course Platform](https://bravecourses.circle.so)
- [Astro Docs](https://docs.astro.build)

## 📝 License

Educational project for 10xDevs course.

---

**Status:** In Development
**Version:** MVP 1.0
**Last Updated:** 2025-11-13
