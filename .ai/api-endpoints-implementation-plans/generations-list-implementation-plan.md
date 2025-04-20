# API Endpoint Implementation Plan: List Generation Sessions

## 1. Endpoint Overview

This endpoint provides a paginated list of generation sessions for the authenticated user. It returns summary information about each session, including the session ID, model identifier, generation counts, and creation timestamp. The endpoint uses HTTP GET and enforces authentication and Row Level Security (RLS) via Supabase, following our tech stack and implementation rules (@tech-stack.md, @shared.mdc, @backend.mdc).

## 2. Request Details

- **Method:** GET
- **URL Structure:** `/api/generations`
- **Parameters:**
  - There are no path parameters.
  - **Query Parameters (optional):**
    - `page` (default: 1)
    - `limit` (default: 10)
- **Request Body:** None

## 3. Utilized Types

- **DTO:** `GenerationSessionDTO` (@types) – represents a generation session with fields such as `id`, `model`, `generated_count`, `accepted_unedited_count`, `accepted_edited_count`, and `created_at`.

## 4. Response Details

- **Success Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "model": "model identifier",
      "generated_count": 10,
      "accepted_unedited_count": 5,
      "accepted_edited_count": 2,
      "created_at": "ISO8601 timestamp"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 50 }
}
```

- **Error Responses:**
  - **401 Unauthorized:** Returned if the user is not authenticated.
  - **500 Internal Server Error:** Returned for unexpected errors.

## 5. Data Flow

1. **Client Request:** The client sends a GET request to `/api/generations` with optional query parameters for pagination.
2. **Middleware Authentication:** The JWT token is validated to ensure the user is authenticated.
3. **Service Layer:** The generation service retrieves generation sessions from the database using Supabase with RLS, applying pagination and sorting if necessary.
4. **Response:** The service returns the list of generation sessions along with pagination metadata in a 200 OK response.

## 6. Security Considerations

- **Authentication & Authorization:** JWT validation and Supabase RLS ensure that the user can only access their own sessions.
- **Input Validation:** Validate query parameters (`page`, `limit`) to ensure they are positive integers.

## 7. Error Handling

- **401 Unauthorized:** If the user's authentication fails.
- **500 Internal Server Error:** For any unexpected server-side errors.

## 8. Performance Considerations

- **Pagination:** Efficient pagination minimizes the amount of data returned per request.
- **Indexing:** Ensure indexes on `user_id` and `created_at` for faster query performance.

## 9. Implementation Steps

1. **Create the Route Handler:**
   - Implement the GET handler in `src/pages/api/generations/index.ts`.
2. **Authenticate User:** Use middleware to ensure the request is from an authenticated user.
3. **Validate Query Parameters:** Verify that `page` and `limit` parameters, if provided, are valid.
4. **Fetch Data:** Query the database for generation sessions with appropriate RLS policies and apply pagination.
5. **Return Response:** Send the list of sessions and pagination details in a 200 OK response.
6. **Error Handling:** Log any errors and return the appropriate error responses.
