# API Endpoint Implementation Plan: Create Flashcards

## 1. Endpoint Overview

This endpoint enables the creation of one or multiple flashcards. It supports both manual creation and AI-generated flashcards. For manual flashcards, the `generation_id` must be null, while for AI-generated cards (`AI-full` or `AI-edited`), the `generation_id` is required. The endpoint uses HTTP POST and interacts with the database via Supabase (with RLS policies) in accordance with our tech stack and implementation rules (@tech-stack.md, @shared.mdc, @backend.mdc).

## 2. Request Details

- **Method:** POST
- **URL Structure:** `/api/flashcards`
- **Parameters:**
  - There are no path parameters.
  - Request must include a JSON payload with the flashcards data.
- **Request Payload (JSON):**

```json
{
  "flashcards": [
    {
      "front": "Question text",
      "back": "Answer text",
      "source": "manual | AI-full | AI-edited",
      "generation_id": "uuid or null"
    }
  ]
}
```

- **Notes:**
  - For a flashcard with source `manual`, `generation_id` must be null.
  - For sources `AI-full` or `AI-edited`, `generation_id` is required.

## 3. Utilized Types

- **DTO/Command Models:**
  - `CreateFlashcardDTO` (@types) – defines the structure for a single flashcard creation request.
  - `CreateFlashcardsCommand` (@types) – command model wrapping an array of flashcards to be created.
  - The response will use a structure similar to `FlashcardDTO` for the created records.

## 4. Response Details

- **Success Response (201 Created):**

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "Question text - maximum length: 200 characters",
      "back": "Answer text - maximum length: 500 characters",
      "source": "manual | AI-full | AI-edited",
      "generation_id": "uuid or null",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp"
    }
  ],
  "failed": [
    {
      "index": 0,
      "error": "Error message"
    }
  ]
}
```

- **Error Responses:**
  - **400 Bad Request:** Returned when the payload is invalid or required fields are missing/incorrect.
  - **401 Unauthorized:** Returned if the user is not authenticated.
  - **500 Internal Server Error:** Returned in case of an unexpected error on the server.

## 5. Data Flow

1. **Client Request:** The client sends a POST request with a JSON payload containing an array of flashcard objects.
2. **Middleware Authentication:** A middleware validates the JWT token, ensuring the user is authenticated.
3. **Request Validation:** Input data is validated using a Zod schema or similar validator. This includes validating field types, string lengths, and ensuring that the `generation_id` rule is enforced based on the flashcard `source`.
4. **Service Layer:** The flashcard service processes each flashcard in the payload:
   - Inserts each valid flashcard into the database while enforcing RLS through Supabase.
   - For any flashcard that fails to be created, records the index and error.
5. **Response:** A combined response is returned with created flashcards under the `data` key and any failures under the `failed` key.

## 6. Security Considerations

- **Authentication & Authorization:** Validate JWT tokens and enforce Supabase RLS policies to ensure that only authenticated users can create flashcards.
- **Input Validation:** Use Zod (or a similar library) to validate the incoming request payload, preventing injection and ensuring consistency.
- **Data Integrity:** Ensure that flashcards with source `manual` have `generation_id` set to null and that AI-generated flashcards include a valid `generation_id`.

## 7. Error Handling

- **400 Bad Request:** For invalid or incomplete payloads, such as missing required fields or invalid data types.
- **401 Unauthorized:** If the JWT token is missing or invalid.
- **500 Internal Server Error:** For unexpected errors like database connection failures. Errors should be logged securely for debugging without exposing sensitive information.

## 8. Performance Considerations

- **Batch Processing:** Support bulk insertion for multiple flashcards to optimize performance.
- **Efficient Database Operations:** Use bulk insert methods where supported to reduce the number of individual database calls.
- **Indexing:** Ensure proper indexing (especially on `user_id` and `created_at`) to expedite the creation process and future queries.

## 9. Implementation Steps

1. **Create the Route Handler:**
   - Implement the POST handler in `src/pages/api/flashcards/index.ts`.
2. **Validate Input Data:**
   - Develop a Zod schema to validate the request payload, including checks for field presence, maximum lengths, and the conditional requirement of `generation_id` based on `source`.
3. **Authenticate User:**
   - Use middleware to validate the user's authentication status and extract user information from the request context.
4. **Process Flashcard Creation:**
   - Iterate over each flashcard in the payload. For each flashcard, perform a database insert via Supabase, ensuring RLS policies are applied.
   - Record successful insertions and capture errors with the corresponding flashcard index if any insert fails.
5. **Return the Response:**
   - Send a 201 Created response with the successfully created flashcards in the `data` array and any errors in the `failed` array.
6. **Error Handling and Logging:**
   - Log any errors encountered during processing, and return appropriate error codes for different types of failures (400, 401, 500).
