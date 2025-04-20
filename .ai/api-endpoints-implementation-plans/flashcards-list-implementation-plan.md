# API Endpoint Implementation Plan: List Flashcards

## 1. Przegląd punktu końcowego

Endpoint umożliwia pobranie paginowanej listy fiszek dla uwierzytelnionego użytkownika. Użytkownik może przeglądać swoje fiszki, korzystając z mechanizmu paginacji oraz sortowania wyników, co usprawnia zarządzanie danymi.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/flashcards`
- **Parametry:**
  - **Wymagane:** Brak (wszystkie parametry są opcjonalne)
  - **Opcjonalne:**
    - `page` (domyślnie: 1) – numer strony
    - `limit` (domyślnie: 10) – liczba elementów na stronie
    - `sort_by` (np. `created_at`) – pole sortujące
    - `order` (`asc` lub `desc`) – kierunek sortowania
- **Request Body:** Brak

## 3. Wykorzystywane typy

- **FlashcardDTO** – reprezentuje dane fiszki przesyłane w odpowiedzi (definiowane w `src/types.ts`).
- **PaginatedResponse<T>** – uniwersalny typ odpowiedzi paginowanej.
- Dodatkowe typy związane z modelem `Flashcard` zdefiniowane w `src/types.ts`.

## 4. Szczegóły odpowiedzi

- **Struktura odpowiedzi (JSON):**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "source": "AI-full | AI-edited | manual",
        "generation_id": "uuid lub null",
        "created_at": "ISO8601 timestamp",
        "updated_at": "ISO8601 timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100
    }
  }
  ```
- **Kody statusu:**
  - 200 OK – poprawne pobranie danych
  - 401 Unauthorized – brak autoryzacji

## 5. Przepływ danych

1. Klient wysyła żądanie GET do `/api/flashcards` z ewentualnymi parametrami zapytania.
2. Middleware weryfikuje autoryzację użytkownika za pomocą tokenu JWT.
3. Serwis odpowiedzialny za obsługę fiszek (np. `FlashcardService`) pobiera dane z bazy, filtrując je wg. `user_id` przy użyciu Supabase i RLS.
4. Dane są paginowane i sortowane zgodnie z przekazanymi parametrami.
5. Sformatowana odpowiedź jest zwracana do klienta w formacie JSON.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Weryfikacja tokenu JWT w middleware umożliwiająca dostęp tylko autoryzowanym użytkownikom.
- **RLS w Supabase:** Użytkownik widzi jedynie swoje fiszki dzięki politykom RLS.
- **Walidacja parametrów:** Sprawdzenie, czy parametry `page`, `limit`, `sort_by` oraz `order` są prawidłowe (np. liczby oraz dozwolone wartości dla `order`).

## 7. Obsługa błędów

- **400 Bad Request:** Gdy przekazane parametry są nieprawidłowe (np. `page` lub `limit` nie są liczbami).
- **401 Unauthorized:** W przypadku braku lub błędnego tokenu autoryzacji.
- **404 Not Found:** W sytuacji, gdy żadne fiszki nie odpowiadają kryteriom zapytania (rzadko występuje).
- **500 Internal Server Error:** W przypadku błędów po stronie serwera lub problemów z bazą danych.

## 8. Rozważania dotyczące wydajności

- Implementacja paginacji przy użyciu `limit` i `offset` w zapytaniach SQL.
- Wykorzystanie indeksów na kolumnach `user_id` oraz `created_at` dla szybszego wyszukiwania.
- Możliwość cache’owania wyników dla bardzo częstych zapytań.

## 9. Etapy wdrożenia

1. Utworzenie nowego endpointu w pliku `/src/pages/api/flashcards/index.ts`.
2. Implementacja middleware weryfikującego token JWT.
3. Walidacja parametrów zapytania (np. przy użyciu biblioteki Zod).
4. Utworzenie serwisu (np. `FlashcardService`) odpowiedzialnego za pobieranie, paginację i sortowanie fiszek z bazy danych przy użyciu Supabase.
5. Wykonanie zapytania do bazy danych z uwzględnieniem RLS i przetwarzanie danych.
6. Formatowanie danych zgodnie z modelem `PaginatedResponse<FlashcardDTO>` i wysłanie odpowiedzi.
