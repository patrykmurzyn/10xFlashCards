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

## 5. Project Scope

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

## 6. Project Status

- **Version:** 0.0.1 (as per `package.json`)
- **Status:** Currently under active development.
