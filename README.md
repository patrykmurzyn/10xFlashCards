# 10xFlashCards

## 1. Project Description

10xFlashCards is a web application designed to streamline the creation and management of educational flashcards. It leverages Language Models (LLMs) via an API to automatically generate flashcard suggestions based on user-provided text, aiming to reduce the time needed for manual flashcard creation and facilitate efficient spaced repetition learning.

## 2. Tech Stack

**Frontend:**

- Astro 5
- React 19
- TypeScript 5
- Tailwind 4
- Shadcn UI

**Backend:**

- Supabase (PostgreSQL Database, Auth, SDKs)

**AI:**

- Deepseek r1/v3 via Openrouter.ai API

**Testing:**

- Jest and React Testing Library (Unit/Component Testing)
- Cypress (End-to-End Testing)
- Playwright (Accessibility Testing)
- Lighthouse (Performance Testing)
- Axe (Accessibility Compliance)

**CI/CD & Hosting:**

- GitHub Actions
- Digital Ocean (Docker)

## 3. Getting Started Locally

Follow these steps to set up the project locally:

**Prerequisites:**

- Node.js (Version `22.14.0` - consider using [nvm](https://github.com/nvm-sh/nvm))
- npm (usually comes with Node.js)
- Supabase Account & Project Setup (for database and authentication)
- OpenRouter.ai API Key (for AI features)

**Installation & Setup:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/patrykmurzyn/10xFlashCards.git
    cd 10xflashcards
    ```
2.  **Set Node.js version (if using nvm):**
    ```bash
    nvm use
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Environment Variables:**
    - Create a `.env` file in the root directory.
    - Add the necessary environment variables (e.g., Supabase URL, Supabase Anon Key, OpenRouter API Key). Refer to `.env.example`.
5.  **Database Setup:**
    - Ensure your Supabase project database schema is set up correctly. (Refer to Supabase project documentation or migration scripts if available).
6.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:4321` (or the port specified by Astro).

## 4. Available Scripts

The following scripts are available via npm:

- `npm run dev`: Starts the local development server with hot reloading.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for previewing.
- `npm run astro ...`: Runs Astro CLI commands (e.g., `astro check`, `astro add`).
- `npm run test`: Runs unit tests using Vitest.
- `npm run test:watch`: Runs unit tests in watch mode.
- `npm run test:ui`: Runs unit tests with UI.
- `npm run test:coverage`: Runs unit tests with coverage report.
- `npm run e2e`: Runs end-to-end tests using Playwright.
- `npm run e2e:ui`: Runs end-to-end tests with UI.
- `npm run e2e:debug`: Runs end-to-end tests in debug mode.
- `npm run e2e:codegen`: Generates test code with Playwright.
- `npm run setup:e2e`: Installs Playwright browsers and dependencies.
- `npm run lint`: Lints the codebase using ESLint.

## 5. Continuous Integration

The project uses GitHub Actions for continuous integration. The workflow is configured in `.github/workflows/ci.yml` and includes:

1. **Linting:** Checks the codebase for linting errors using ESLint.
2. **Unit Tests:** Runs all unit tests using Vitest.
3. **End-to-End Tests:** Runs all E2E tests using Playwright.

The CI workflow automatically creates required environment files:

- `.env` - Used by the application and unit tests, containing Supabase and OpenRouter API keys
- `.env.test` - Used by E2E tests, containing test user credentials and API keys

For E2E tests, the workflow automatically:

1. Creates the necessary environment files
2. Starts the application server (configured in `playwright.config.ts`)
3. Runs the Playwright tests against the running application
4. Uploads test reports and results as artifacts

The workflow uses the "Test" environment configured in the GitHub repository with these secrets:

- `E2E_USERNAME` and `E2E_PASSWORD`: Used for authentication in E2E tests
- `OPENROUTER_API_KEY`: API key for OpenRouter.ai
- `PUBLIC_SUPABASE_KEY` and `PUBLIC_SUPABASE_URL`: Supabase credentials

To run the CI workflow locally before pushing:

```bash
# Run unit tests (requires .env file)
npm run test

# Setup E2E testing environment - install browsers (one-time setup)
npm run setup:e2e

# Run E2E tests (requires both .env and .env.test files)
npm run e2e
```

## 6. Project Scope

**Core Features:**

- Automatic flashcard generation from text using an LLM.
- Review, edit, approve, or reject AI-generated suggestions.
- Manual creation, editing, and deletion of flashcards.
- User registration, login, and account management (including deletion).
- Integration with a spaced repetition algorithm for learning sessions.
- Secure storage of user data and flashcards (GDPR compliant).
- Tracking statistics on AI-generated vs. accepted flashcards.

**Out of Scope (MVP):**

- Custom-built spaced repetition algorithm.
- Gamification features.
- Native mobile applications.
- Support for multiple document formats (PDF, DOCX, etc.).
- Public API access.
- Flashcard sharing between users.
- Advanced notification system.
- Advanced keyword search for flashcards.

## 7. Project Status

- **Version:** 0.0.1 (as per `package.json`)
- **Status:** Currently under active development.
