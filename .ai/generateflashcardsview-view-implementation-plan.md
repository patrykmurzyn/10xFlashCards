# Plan implementacji widoku GenerateFlashcardsView

## 1. Przegląd

Widok "GenerateFlashcardsView" umożliwia użytkownikowi wklejenie długiego bloku tekstu (1000–10000 znaków), wygenerowanie za pomocą AI propozycji fiszek, a następnie przegląd, edycję, akceptację lub odrzucenie każdej sugestii oraz zapis zaakceptowanych fiszek w bazie.

## 2. Routing widoku

Ścieżka: `/flashcards/generate`
Widok osadzony w `ProtectedLayout`, dostępny tylko dla zalogowanych użytkowników.

## 3. Struktura komponentów

- GenerateFlashcardsPage (Astro .astro)
  - ProtectedLayout
    - GenerateFlashcardsView (React)
      - TextAreaWithCounter
      - GenerateButton
      - SkeletonLoader (conditional)
      - FlashcardSuggestionList
        - FlashcardSuggestionItem\* (lista sugestii)
          - (inline) EditFlashcardForm
      - SaveSelectedButton

## 4. Szczegóły komponentów

### GenerateFlashcardsPage

- Opis: Strona Astro, ładuje layout i dynamiczny komponent React.
- Główne elementy:
  - `<ProtectedLayout>`
  - `<GenerateFlashcardsView client:load />`
- Zdarzenia: brak (czysto renderuje React).
- Walidacja: brak.
- Typy: brak.
- Propsy: brak.

### GenerateFlashcardsView

- Opis: Główny komponent zarządzający stanem i logiką generowania sugestii.
- Główne elementy:
  - `TextAreaWithCounter` (value, onChange)
  - `GenerateButton` (onClick)
  - `SkeletonLoader` (podczas isGenerating)
  - `FlashcardSuggestionList` (lista suggestions)
  - `SaveSelectedButton` (onClick)
- Obsługiwane interakcje:
  - onSourceTextChange
  - onGenerateClick
  - onApproveSuggestion(id)
  - onRejectSuggestion(id)
  - onEditSuggestion(id, updatedFront, updatedBack)
  - onSaveSelected
- Walidacja:
  - `sourceText.length >= 1000 && <= 10000`
  - Minimum jedna approved sugestia przed zapisem
- Typy:
  - GenerateFlashcardsCommand, GeneratedFlashcardsDTO
  - FlashcardSuggestionVM (custom ViewModel)
  - CreateFlashcardsCommand, CreateFlashcardDTO
- Propsy: brak (sam zarządza stanem)

### TextAreaWithCounter

- Opis: Rozszerzenie `<textarea>` z licznikiem znaków i walidacją.
- Główne elementy:
  - `<textarea>`
  - `<div>` z licznikiem `X / 10000`
- Zdarzenia: onChange
- Walidacja: minLength 1000, maxLength 10000 (wizualny feedback)
- Typy: value: string, maxLength, onChange
- Propsy: { value, onChange, maxLength, minLength }

### GenerateButton

- Opis: Przycisk inicjujący generowanie.
- Główne elementy:
  - `<button>` z etykietą "Generuj"
- Zdarzenia: onClick
- Propsy: { disabled, onClick }

### SkeletonLoader

- Opis: Wyświetla placeholder podczas ładowania.
- Renderuje prostą strukturę szkieletu.
- Propsy: brak lub opcjonalnie `rows`, `count`

### FlashcardSuggestionList

- Opis: Lista sugestii fiszek.
- Główne elementy: `<ul>` z dziećmi `<FlashcardSuggestionItem>`
- Propsy: { suggestions: FlashcardSuggestionVM[], callbacks }

### FlashcardSuggestionItem

- Opis: Pojedyncza sugestia z front/back i akcjami.
- Główne elementy:
  - Front (tekst)
  - Back (tekst)
  - Przyciski: Approve, Edit, Reject
- Zdarzenia:
  - onApprove, onReject, onEdit
- Walidacja: po edycji front/back te same limity co w create schema
- Typy: FlashcardSuggestionVM
- Propsy: { suggestionVM, onApprove, onReject, onEdit }

### EditFlashcardForm (inline lub modal)

- Opis: Formularz edycji front/back.
- Główne elementy:
  - `<input>` dla front
  - `<textarea>` dla back
  - Przycisk Save, Cancel
- Zdarzenia: onChange front/back, onSave, onCancel
- Walidacja: front 1-200, back 1-500 (natychmiastowy feedback)
- Typy: { front, back }

### SaveSelectedButton

- Opis: Przycisk zapisujący zaakceptowane sugestie.
- Główne elementy: `<button>` "Zapisz wybrane"
- Zdarzenia: onClick
- Disabled gdy brak approved sugestii lub isSaving
- Propsy: { disabled, onClick }

## 5. Typy

- FlashcardSuggestionVM:
  ```ts
  interface FlashcardSuggestionVM {
    id: string;
    front: string;
    back: string;
    status: "pending" | "approved" | "edited" | "rejected";
    generationId: string;
  }
  ```
- GenerateFlashcardsCommand, GeneratedFlashcardsDTO (z `src/types.ts`)
- CreateFlashcardsCommand, CreateFlashcardDTO, FlashcardDTO (z `src/types.ts`)

## 6. Zarządzanie stanem

- Lokalny stan w `GenerateFlashcardsView` z React.useState:
  - `sourceText`, `validationError`
  - `isGenerating`, `suggestions`
  - `isSaving`, `saveError`, `saveSuccess`
- Custom Hook (opcjonalnie): `useGenerateFlashcards` i `useSaveFlashcards` do enkapsulacji logiki fetch.

## 7. Integracja API

- Generowanie:
  ```ts
  POST / api / flashcards / generate;
  Request: GenerateFlashcardsCommand;
  Response: GeneratedFlashcardsDTO;
  ```
- Zapis:
  ```ts
  POST / api / flashcards;
  Request: CreateFlashcardsCommand;
  Response: CreateFlashcardsResult;
  ```

## 8. Interakcje użytkownika

1. Wkleja tekst → live counter → walidacja klient-side
2. Klik "Generuj" → walidacja i fetch → loader
3. Pojawienie się listy sugestii
4. Klik "Approve" → zmiana statusu
5. Klik "Edit" → inline edycja i zatwierdzenie → status 'edited'
6. Klik "Reject" → status 'rejected' / ukrycie
7. Klik "Zapisz wybrane" → walidacja, fetch → toast komunikaty

## 9. Warunki i walidacja

- `sourceText` długość 1000–10000
- Edited front 1–200
- Edited back 1–500
- Przycisk zapisu aktywny tylko przy min. jednej approved sugestii

## 10. Obsługa błędów

- Walidacja lokalna → komunikaty inline obok textarea
- Błędy sieci/API generate → toast + stan error
- Błędy createFlashcards (pojedyncze failed) → pokazanie listy błędów lub tooltipów przy sugestiach
- `aria-live` region dla komunikatów błędów i sukcesów

## 11. Kroki implementacji

1. Utworzyć plik strony Astro: `src/pages/flashcards/generate.astro`.
2. Osadzić `ProtectedLayout` i `<GenerateFlashcardsView client:load />`.
3. Stworzyć `GenerateFlashcardsView.tsx` w `src/components/flashcards`.
4. Zaimplementować UI: `TextAreaWithCounter`, `GenerateButton`, `SkeletonLoader`.
5. Dodać state management i walidację (`useState`, walidacja długości).
6. Zaimplementować API call w `useGenerateFlashcards` hook.
7. Stworzyć `FlashcardSuggestionList` i `FlashcardSuggestionItem` z przyciskami.
8. Dodać inline edycję w `EditFlashcardForm`.
9. Zaimplementować `SaveSelectedButton` i hook `useSaveFlashcards`.
10. Dodać obsługę toastów i aria-live.
11. Dodać testy jednostkowe/UI dla głównych scenariuszy.
12. Przeprowadzić review kodu i testy manualne dostępności.

---

Plan zgodny z PRD, User Stories, API i tech stackiem (Astro, React, TS, Tailwind, Shadcn UI).
