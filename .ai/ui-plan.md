# UI Architecture for 10xFlashCards

## 1. UI Structure Overview

The application is divided into two main sections: public (login and registration) and protected (accessible after authentication). The protected version uses `ProtectedLayout`, which includes a Topbar with `NavigationMenu` from Shadcn UI, `ToastProvider`, and a main `main` container. Routing is based on Astro with guard routing.

## 2. List of Views

- **LoginView** (`/auth/login`)

  - Purpose: user authentication.
  - Key information: `email`, `password` fields, `Log In` button, link to registration.
  - Key components: form with validation (zod), error handling, `aria-invalid`, `aria-describedby`.
  - UX, accessibility, security: focus on the first field, clear messages, password masking.

- **RegisterView** (`/auth/register`)

  - Purpose: registration of a new user.
  - Key information: `email`, `password`, `confirm password` fields, `Register` button, link to login.
  - Key components: form with validation, error messages.
  - UX, accessibility, security: password verification, hints.

- **Dashboard** (`/dashboard`)

  - Purpose: quick overview of user statistics.
  - Key information: 10 most recent flashcards, progress chart, generation statistics.
  - Key components: `ProgressChart`, list of recent flashcards.
  - UX, accessibility, security: `aria-live` during loading, error handling via toasts.

- **GenerateFlashcardsView** (`/flashcards/generate`)

  - Purpose: generating flashcard suggestions based on text.
  - Key information: `textarea` (1000–10000 characters), counter, `Generate` button, skeleton, suggestion list.
  - Key components: `TextAreaWithCounter`, `SkeletonLoader`, `FlashcardSuggestionList`.
  - UX, accessibility, security: `aria-live` for results, length validation.

- **FlashcardsListView** (`/flashcards`)

  - Purpose: reviewing and managing saved flashcards.
  - Key information: paginated list of flashcards (front/back), `Edit`, `Delete` buttons.
  - Key components: `FlashcardList`, `PaginationControls`, `ConfirmDialog`.
  - UX, accessibility, security: focus trap in modals, `aria-controls`.

- **EditFlashcardModal** (modal in `/flashcards`)

  - Purpose: editing an existing flashcard.
  - Key information: `front`, `back` fields, `Save`, `Cancel` buttons.
  - Key components: `Modal`, form with zod.
  - UX, accessibility, security: focus trap, `aria-labelledby`.

- **ProfileView** (`/profile`)

  - Purpose: managing user account.
  - Key information: email, avatar, subscription status, `Change Password`, `Logout` buttons.
  - Key components: `UserForm`, `Avatar`, `ToastProvider`.
  - UX, accessibility, security: logout confirmation, `aria-live`.

- **ReviewSessionView** (`/session`)
  - Purpose: spaced repetition review session.
  - Key information: flashcard (front → reveal back), rating, progress.
  - Key components: `ReviewCard`, `RatingControls`, `ProgressIndicator`.
  - UX, accessibility, security: lazy loading (React.lazy/Suspense), `aria-live` for changes.

## 3. User Journey Map

1. Registration (`/auth/register`) → redirect to `/dashboard`.
2. Dashboard (`/dashboard`) → overview of statistics.
3. Generate flashcards (`/flashcards/generate`) → paste text → generate → review → save.
4. Flashcards list (`/flashcards`) → edit/delete (modal/confirm).
5. Review session (`/session`) → ratings → return to dashboard.
6. Profile (`/profile`) → settings change/logout.

## 4. Navigation Layout and Structure

- **AuthLayout**: simple form background.
- **ProtectedLayout**: Topbar with `NavigationMenu` (Dashboard, Generate, My Flashcards, Session, Profile), `ToastProvider`, `main` container.
- Guard routing: unauthenticated users redirected to `/auth/login`.
- Mobile: hamburger menu with focus trap.

## 5. Key Components

- Layouts: `ProtectedLayout`, `AuthLayout`
- Navigation: `NavigationMenu`, `ToastProvider`
- Loading: `SkeletonLoader`, `LoadingSpinner`
- Forms: `TextAreaWithCounter`, `Modal`, `ConfirmDialog`, `UserForm`
- Lists and pagination: `FlashcardList`, `FlashcardSuggestionList`, `PaginationControls`
- Session: `ReviewCard`, `RatingControls`, `ProgressIndicator`, `ProgressChart`
- State management: Zustand hooks (`useAuthStore`, `useFlashcardsStore`, `useSessionStore`)
- Accessibility: `aria-live`, `aria-invalid`, `aria-describedby`, focus trap
