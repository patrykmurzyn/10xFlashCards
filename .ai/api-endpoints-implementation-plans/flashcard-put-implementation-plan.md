# API Endpoint Implementation Plan: Update a Flashcard (Approval or Edit)

## 1. Endpoint Overview

This endpoint allows an authenticated user to update the details of an existing flashcard. It is used for both editing manual flashcards and approving AI-generated flashcard suggestions. The endpoint accepts a JSON payload containing updated flashcard fields and updates the flashcard record in the database using Supabase with RLS policies, following our tech stack and implementation rules (@tech-stack.md, @shared.mdc, @backend.mdc).

## 2. Request Details

- **Method:** PUT
- **URL Structure:** `/api/flashcards/{id}`
- **Parameters:**
  - **Required:**
    - `id` (Path Parameter): UUID of the flashcard to update.
- \*\*Request Payload (JSON):

```json
{
  "front": "Updated question - max length 200 characters",
  "back": "Updated answer - max length 500 characters",
  "source": "AI-edited | manual"
}
```

- **Notes:**
  - The `source` field must be either 'AI-edited' or 'manual'.

## 3. Utilized Types

- **DTO/Command Model:**
  - `UpdateFlashcardCommand` (@types) – defines the structure for updating flashcards with the editable fields `front`, `back`, and `source`.

## 4. Response Details

- **Success Response (200 OK):**
  - Returns the updated flashcard object containing fields such as `id`, `front`, `back`, `source`, `generation_id`, `created_at`, and `updated_at`.
- **Error Responses:**
  - **400 Bad Request:** Returned if the payload is invalid (e.g. missing required fields, or invalid field values).
  - **401 Unauthorized:** Returned if the user is not authenticated.
  - **404 Not Found:** Returned if no flashcard is found matching the provided `id` or if it does not belong to the authenticated user.
  - **500 Internal Server Error:** Returned for unexpected server-side errors.

## 5. Data Flow

1. **Client Request:** The client sends a PUT request to `/api/flashcards/{id}` with the flashcard UUID as a path parameter and updated data in the JSON payload.
2. **Middleware Authentication:** Middleware validates the JWT token to ensure the user is authenticated.
3. **Request Validation:** Input is validated using a Zod schema or similar validator to enforce data types, field lengths, and presence of required fields.
4. **Service Layer:** The flashcard service updates the flashcard record in the database, ensuring the flashcard belongs to the authenticated user via Supabase RLS.
5. **Response:** The updated flashcard is returned on success, or an appropriate error response is sent if the update fails.

## 6. Security Considerations

- **Authentication & Authorization:** Ensure the JWT token is valid and that the flashcard being updated belongs to the authenticated user.
- **Input Validation:** Use Zod or a similar library to validate the input payload to prevent injection attacks and ensure data integrity.
- **Data Integrity:** Confirm that the updates meet the data requirements of the flashcard model.

## 7. Error Handling

- **400 Bad Request:** For invalid or incomplete payloads.
- **401 Unauthorized:** If the user is not authenticated.
- **404 Not Found:** If the flashcard is not found or does not belong to the user.
- **500 Internal Server Error:** For unexpected errors such as database failures. Log errors securely for debugging without exposing sensitive information.

## 8. Performance Considerations

- **Efficient Updates:** Use optimized database queries to update the flashcard record with minimal latency.
- **Indexing:** Ensure that the `id` and `user_id` fields are indexed to facilitate quick lookups and authorization checks.

## 9. Implementation Steps

1. **Create the Route Handler:**
   - Implement the PUT handler in `src/pages/api/flashcards/[id].ts`.
2. **Validate Input Data:**
   - Develop a Zod schema to validate the JSON payload, ensuring that `front`, `back`, and `source` meet the required criteria.
3. **Authenticate User:**
   - Use middleware to verify the user's authentication status and extract the user information.
4. **Process the Update:**
   - Update the flashcard record in the database using the provided `id` and new data, ensuring that the record belongs to the authenticated user (via Supabase RLS).
5. **Return the Response:**
   - If the update is successful, return a 200 OK response with the updated flashcard details.
   - If the flashcard is not found or does not belong to the user, return a 404 Not Found response.
6. **Error Handling and Logging:**
   - Log any errors, and return appropriate HTTP status codes and messages for validation errors (400), unauthorized access (401), not found (404), or other server errors (500).
