# API Endpoint Implementation Plan: Generate Flashcards from Text

## 1. Przegląd punktu końcowego

Endpoint ma na celu przyjmowanie długiego bloku tekstu (od 1000 do 10000 znaków) i wywoływanie usługi AI w celu wygenerowania propozycji fiszek. Propozycje te zawierają pytania (front) i odpowiedzi (back), a cały proces jest zintegrowany z bazą danych (np. tabela generations) oraz logowaniem ewentualnych błędów (tabela generation_error_logs).

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** /api/flashcards/generate
- **Parametry:**
  - **Wymagane:**
    - `source_text`: string (długość od 1000 do 10000 znaków)
  - **Opcjonalne:** Brak
- **Treść żądania (Request Body):**
  ```json
  {
    "source_text": "<tekst o długości od 1000 do 10000 znaków>"
  }
  ```

## 3. Wykorzystywane typy

- **DTO i Command Modele:**
  - `GeneratedFlashcardsDTO` – definiuje strukturę odpowiedzi, zawierającą m.in. `generation_id`, `model`, `suggestions` oraz `generated_count`.
  - `FlashcardSuggestion` – zawiera pola: `front`, `back`, `source` (wartość stała 'AI-full').
  - `GenerateFlashcardsCommand` – model komendy przyjmujący `source_text`.
- **Referencje:** patrz: @types (definicje znajdują się w pliku src/types.ts)

## 4. Szczegóły odpowiedzi

- **Struktura odpowiedzi:**
  ```json
  {
    "generation_id": "uuid",
    "model": "model identifier",
    "suggestions": [
      {
        "front": "Generated question",
        "back": "Generated answer",
        "source": "AI-full"
      }
    ],
    "generated_count": number
  }
  ```
- **Kody statusu:**
  - 200 OK lub 201 Created dla pomyślnego wygenerowania fiszek
  - 400 Bad Request dla nieprawidłowych danych wejściowych
  - 401 Unauthorized dla braku autoryzacji
  - 422 Unprocessable Entity, jeżeli długość tekstu nie mieści się w dozwolonym zakresie
  - 500 Internal Server Error dla błędów po stronie serwera

## 5. Przepływ danych

1. Klient wysyła żądanie POST do `/api/flashcards/generate` z polem `source_text`.
2. Warstwa weryfikacji waliduje długość tekstu i autentykację za pomocą JWT.
3. Po walidacji, wywoływany jest serwis AI, który komunikuje się z modelem językowym w celu wygenerowania propozycji fiszek.
4. Na podstawie wygenerowanej odpowiedzi, tworzony jest rekord sesji generacji w tabeli `generations`.
5. W przypadku wystąpienia błędów (np. problem z modelem AI), logi błędów są zapisywane w tabeli `generation_error_logs`.
6. Odpowiedź zwracana jest do klienta w postaci JSON zawierającego `generation_id`, identyfikator modelu, listę sugestii oraz liczbę wygenerowanych fiszek.

## 6. Względy bezpieczeństwa

- **Autoryzacja:** Wykorzystanie JWT do weryfikacji użytkownika przy każdym żądaniu.
- **Walidacja danych:** Stosowanie walidacji długości `source_text` (od 1000 do 10000 znaków) przy użyciu np. Zod.
- **Baza danych:** Wdrożenie RLS (Row Level Security) na operacjach bazodanowych w Supabase.
- **Ochrona przed atakami:** Walidacja i sanitizacja wejścia użytkownika, ograniczenie częstotliwości żądań (rate limiting).

## 7. Obsługa błędów

- **Potencjalne błędy:**
  - Błędne dane wejściowe (np. zbyt krótki lub zbyt długi `source_text`)
  - Błąd autentykacji (brak ważnego tokena JWT)
  - Niepowodzenie wywołania usługi AI (problemy z modelem językowym)
  - Błąd podczas zapisu do bazy danych
- **Kody statusu:**
  - 400 Bad Request
  - 401 Unauthorized
  - 422 Unprocessable Entity
  - 500 Internal Server Error
- **Logowanie:** Wszelkie błędy związane z wywołaniem AI lub operacjami bazodanowymi powinny być logowane do tabeli `generation_error_logs`.

## 8. Rozważania dotyczące wydajności

- **Asynchroniczność:** Rozważenie użycia asynchronicznych wywołań do usługi AI, aby nie blokować głównego wątku.
- **Cache:** Możliwe użycie mechanizmów cache'ujących dla często powtarzających się zapytań lub wyników generacji, jeśli to ma sens w danej logice biznesowej.
- **Optymalizacja bazy danych:** Upewnienie się, że operacje zapisu i odczytu bazy danych są zoptymalizowane oraz korzystanie z indeksów tam, gdzie to potrzebne.

## 9. Etapy wdrożenia

1. **Utworzenie endpointu:** Dodanie nowego pliku API w katalogu `/src/pages/api/flashcards/generate`.
2. **Walidacja żądania:** Implementacja walidacji wejścia (np. przy użyciu Zod) oraz sprawdzenie autentykacji użytkownika.
3. **Serwis generacji:** Utworzenie lub rozszerzenie warstwy serwisowej odpowiedzialnej za komunikację z modelem językowym. Na tym etapie skorzystamy z mocków zamiast wywoływania serwisu AI
4. **Operacje bazodanowe:** Implementacja zapisu rekordu sesji generacji w tabeli `generations` oraz logowanie błędów w `generation_error_logs`.
5. **Obsługa odpowiedzi:** Sformułowanie poprawnej struktury odpowiedzi zgodnie ze specyfikacją DTO.
6. **Testy:** Napisanie testów jednostkowych i integracyjnych dla endpointu, w tym testy dla warunków brzegowych i obsługi błędów.
7. **Przegląd i wdrożenie:** Finalny przegląd kodu przez zespół oraz wdrożenie na środowisko testowe/produkcyjne.
