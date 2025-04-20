/_ Final PostgreSQL Database Schema for 10xFlashCards _/

# Database Schema for 10xFlashCards

## 1. Tabele

### Tabela: users

- **id**: UUID, Primary Key, default generated (e.g., uuid_generate_v4()), managed by Supabase Auth
- **email**: VARCHAR (255) NOT NULL, UNIQUE
- **encrypted_password**: VARCHAR NOT NULL
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
- **confirmed_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()

### Tabela: flashcards

- **id**: UUID, Primary Key, default generated (e.g., uuid_generate_v4())
- **front**: VARCHAR(200) NOT NULL
- **back**: VARCHAR(500) NOT NULL
- **source**: VARCHAR(50) NOT NULL, CHECK constraint to allow only ('AI-full', 'AI-edited', 'manual')
- **generation_id**: UUID, nullable, Foreign Key referencing `generations(id)`, on delete set NULL
- **user_id**: UUID NOT NULL, Foreign Key referencing `users(id)`
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), automatically updated using trigger on UPDATE

### Tabela: generations

- **id**: UUID, Primary Key, default generated (e.g., uuid_generate_v4())
- **user_id**: UUID NOT NULL, Foreign Key referencing `users(id)`
- **model**: VARCHAR(50) NOT NULL
- **generated_count**: INTEGER NOT NULL
- **accepted_unedited_count**: INTEGER NULLABLE
- **accepted_edited_count**: INTEGER NULLABLE
- **source_text_hash**: VARCHAR NOT NULL
- **source_text_length**: INTEGER NOT NULL, CHECK (source_text_length BETWEEN 500 AND 10000)
- **generation_duration**: INTEGER NOT NULL -- reprezentuje czas trwania generacji w sekundach
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), automatically updated using trigger on UPDATE

### Tabela: generation_error_logs

- **id**: UUID, Primary Key, default generated (e.g., uuid_generate_v4())
- **user_id**: UUID NOT NULL, Foreign Key referencing `users(id)`
- **model**: VARCHAR NOT NULL
- **source_text_hash**: VARCHAR NOT NULL
- **source_text_length**: INTEGER NOT NULL, CHECK (source_text_length BETWEEN 500 AND 10000)
- **error_code**: VARCHAR NOT NULL
- **error_message**: VARCHAR NOT NULL
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()

## 2. Relacje między tabelami

- Każdy user (`users`) ma wiele fiszek (`flashcards`), ma wiele rekordów w tabeli generations (`generations`) oraz ma wiele rekordów w tabeli generation_error_logs (`generation_error_logs`).
- Każda fiszka (`flashcards`) należy do jednego użytkownika (`user_id`) i może opcjonalnie być powiązana z jedną generacją (`generation_id`).
- Każda generacja (`generations`) należy do jednego użytkownika (`user_id`).
- Każdy log błędu (`generation_error_logs`) należy do jednego użytkownika (`user_id`).

## 3. Indeksy

- Indeks na kolumnie **user_id** w tabelach `flashcards`, `generations` i `generation_error_logs` dla optymalizacji zapytań związanych z identyfikatorem użytkownika.
- Indeks na kolumnie **created_at** w tabeli `flashcards` oraz w `generations` do szybkiego sortowania wg daty.
- Indeks na kolumnie **generation_id** w tabeli `flashcards`

## 4. Zasady PostgreSQL (RLS)

- Włączyć mechanizm Row Level Security (RLS) dla tabel: `users`, `flashcards`, `generations` oraz `generation_error_logs`.
- Utworzyć polityki RLS umożliwiające dostęp jedynie do wierszy, gdzie `user_id` odpowiada identyfikatorowi aktualnie zalogowanego użytkownika - auth.uid() == `user_id`.
- Polityki powinny obejmować operacje SELECT, INSERT, UPDATE oraz DELETE.

## 5. Dodatkowe uwagi

- Wszystkie klucze główne są typu UUID, co gwarantuje unikalność i skalowalność.
- Schemat został zaprojektowany z myślą o przyszłych migracjach oraz możliwościach rozszerzenia o nowe kolumny lub indeksy.
- Kolumna `generation_duration` w tabeli `generations` przyjmuje wartość w sekundach jako typ INTEGER.
