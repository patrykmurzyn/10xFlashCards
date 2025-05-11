# OpenRouter Service Implementation Guide

## 1. Service Description

This service acts as an interface between the 10xFlashCards application and the OpenRouter API. Its primary purpose is to facilitate interactions with various Large Language Models (LLMs) available through OpenRouter, enabling features like chat completions and potentially structured data generation based on user input or application context. It will handle request formatting, API communication, response parsing, and error management according to the project's coding practices.

## 2. Constructor Description

The `OpenRouterService` class will be initialized without arguments. It will internally load the necessary configuration, specifically the OpenRouter API key, from environment variables during instantiation or upon the first API call.

```typescript
// File: src/lib/services/openrouter.service.ts

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema"; // Dependency needed

// Define basic types (align with OpenRouter API)
type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ResponseFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: object; // JSON schema object
  };
};

// Custom Error class for service-specific issues
export class OpenRouterError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class OpenRouterService {
  private apiKey: string;
  private apiBaseUrl: string = "https://openrouter.ai/api/v1"; // Default OpenRouter base URL

  constructor() {
    // Load API Key from environment variables
    const apiKey = import.meta.env.PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey || typeof apiKey !== "string") {
      console.error(
        "OpenRouter API key is missing or invalid. Please set PUBLIC_OPENROUTER_API_KEY environment variable."
      );
      throw new OpenRouterError("Missing OpenRouter API Key configuration.");
    }
    this.apiKey = apiKey;
    // Optional: Allow overriding base URL via env var if needed
    // this.apiBaseUrl = import.meta.env.OPENROUTER_API_BASE_URL || this.apiBaseUrl;
  }

  // ... public and private methods ...
}
```

## 3. Public Methods and Fields

The primary public method will be `chatCompletion`.

```typescript
  /**
   * Sends a request to the OpenRouter chat completions endpoint.
   *
   * @param options - The options for the chat completion request.
   * @param options.model - The name of the model to use (e.g., 'deepseek/deepseek-chat').
   * @param options.messages - An array of message objects (system, user, assistant).
   * @param options.responseSchema - Optional Zod schema to enforce structured JSON output.
   * @param options.schemaName - Optional name for the JSON schema (required if responseSchema is provided).
   * @param options.temperature - Optional sampling temperature (e.g., 0.7).
   * @param options.max_tokens - Optional maximum number of tokens to generate.
   * @returns A promise that resolves to the string content of the assistant's response,
   *          or a parsed JSON object if responseSchema was provided.
   * @throws {OpenRouterError} If the API request fails, the response is invalid,
   *         or schema validation fails.
   */
  public async chatCompletion<T extends z.ZodTypeAny = z.ZodNever>(options: {
    model: string;
    messages: Message[];
    responseSchema?: T;
    schemaName?: string;
    temperature?: number;
    max_tokens?: number;
    // Add other valid OpenRouter parameters as needed
  }): Promise<string | z.infer<T>> {
    // Implementation details...
    const payload = this._preparePayload(options);
    const response = await this._callApi('/chat/completions', payload);
    return this._parseResponse(response, options.responseSchema);
  }
```

## 4. Private Methods and Fields

- `apiKey: string`: Stores the OpenRouter API key.
- `apiBaseUrl: string`: Stores the base URL for the OpenRouter API.
- `_preparePayload(options): object`: Formats the request payload based on the options passed to `chatCompletion`. This includes structuring messages, model name, parameters, and constructing the `response_format` object if a Zod schema is provided. Requires `zod-to-json-schema`.
- `_createResponseFormat(schema: z.ZodTypeAny, name: string): ResponseFormat`: Helper to generate the `response_format` object using `zod-to-json-schema`.
- `_callApi(endpoint: string, payload: object): Promise<Response>`: Uses the native `fetch` API to make the POST request to the specified OpenRouter endpoint. Handles setting `Authorization` and `Content-Type` headers. Includes basic network error handling.
- `_parseResponse<T extends z.ZodTypeAny>(response: Response, schema?: T): Promise<string | z.infer<T>>`: Checks the HTTP response status. Parses the JSON body. If a `schema` is provided, it parses the response content as JSON and validates it against the Zod schema. Throws `OpenRouterError` for non-OK statuses, JSON parsing errors, or schema validation failures.

```typescript
  // Example structure for private methods

  private _preparePayload(options: any): object {
    const { model, messages, responseSchema, schemaName, ...restParams } = options;

    const payload: any = {
      model,
      messages,
      ...restParams, // Include temperature, max_tokens etc.
    };

    if (responseSchema) {
      if (!schemaName) {
        throw new OpenRouterError("schemaName is required when responseSchema is provided.");
      }
      payload.response_format = this._createResponseFormat(responseSchema, schemaName);
    }

    return payload;
  }

  private _createResponseFormat(schema: z.ZodTypeAny, name: string): ResponseFormat {
      try {
          // Convert Zod schema to JSON schema object
          // The 'name' parameter in zodToJsonSchema might not be directly used by OpenRouter's format,
          // but it's part of the library's API. We use the provided 'name' for OpenRouter's schema name field.
          const jsonSchema = zodToJsonSchema(schema, name);

          return {
              type: 'json_schema',
              json_schema: {
                  name: name, // Name required by OpenRouter
                  strict: true, // Enforce schema adherence
                  schema: jsonSchema, // The generated JSON schema structure
              },
          };
      } catch (error) {
          console.error("Failed to convert Zod schema to JSON schema:", error);
          throw new OpenRouterError("Invalid response schema provided.", error);
      }
  }


  private async _callApi(endpoint: string, payload: object): Promise<Response> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          // Optional: Add 'HTTP-Referer': your_site_url, 'X-Title': your_app_name
          // See OpenRouter docs for recommended headers
        },
        body: JSON.stringify(payload),
      });
      return response;
    } catch (error) {
      console.error(`Network error calling OpenRouter API: ${endpoint}`, error);
      throw new OpenRouterError(`Network error communicating with OpenRouter: ${(error as Error).message}`, error);
    }
  }

  private async _parseResponse<T extends z.ZodTypeAny>(response: Response, schema?: T): Promise<string | z.infer<T>> {
    if (!response.ok) {
      let errorBody = `Status: ${response.status}`;
      try {
        const errorJson = await response.json();
        errorBody += `, Body: ${JSON.stringify(errorJson)}`;
      } catch (e) { /* Ignore if error body isn't valid JSON */ }
      console.error(`OpenRouter API error: ${errorBody}`);
      throw new OpenRouterError(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    let responseData: any;
    try {
      responseData = await response.json();
    } catch (error) {
      console.error("Failed to parse JSON response from OpenRouter:", error);
      throw new OpenRouterError("Invalid JSON response received from OpenRouter.", error);
    }

    const messageContent = responseData?.choices?.[0]?.message?.content;
    if (typeof messageContent !== 'string') {
        console.error("Invalid response structure from OpenRouter:", responseData);
        throw new OpenRouterError("Unexpected response structure received from OpenRouter.");
    }


    if (schema) {
      try {
        const parsedJson = JSON.parse(messageContent);
        // Validate the parsed JSON against the Zod schema
        const validationResult = schema.safeParse(parsedJson);
        if (!validationResult.success) {
            console.error("OpenRouter response failed schema validation:", validationResult.error);
            throw new OpenRouterError("Response failed schema validation.", validationResult.error);
        }
        return validationResult.data; // Return validated data
      } catch (error) {
        if (error instanceof OpenRouterError) throw error; // Re-throw validation error
        console.error("Failed to parse or validate structured response content:", error);
        throw new OpenRouterError("Failed to parse response content as expected JSON.", error);
      }
    } else {
      return messageContent; // Return plain string content
    }
  }
```

## 5. Error Handling

- **Configuration Errors**: The constructor throws an `OpenRouterError` if the `PUBLIC_OPENROUTER_API_KEY` environment variable is missing or invalid.
- **Network Errors**: `_callApi` catches errors during the `fetch` call (e.g., DNS resolution failure, connection timeout) and throws an `OpenRouterError`. Retries could be added here for transient issues (e.g., using an exponential backoff strategy for specific status codes like 429 or 5xx).
- **API Errors**: `_parseResponse` checks `response.ok`. For non-2xx responses, it attempts to read the error body, logs the details, and throws an `OpenRouterError` with the status code.
- **Response Parsing Errors**: `_parseResponse` uses `try...catch` when calling `response.json()` and throws an `OpenRouterError` if parsing fails.
- **Schema Validation Errors**: If a `responseSchema` (Zod schema) is provided, `_parseResponse` uses `try...catch` around `JSON.parse()` of the message content and `schema.safeParse()`. If parsing or validation fails, it throws an `OpenRouterError`, including the Zod validation error details if available.
- **Invalid Input**: The `_preparePayload` method includes a check to ensure `schemaName` is provided when `responseSchema` is used, throwing an `OpenRouterError` if not. Further input validation (e.g., ensuring `messages` array is not empty) can be added.

All errors originating from the service should be instances of `OpenRouterError` or a more specific subclass if needed, allowing calling code to handle them appropriately. Follow clean code guidelines: use early returns and guard clauses for error conditions.

## 6. Security Considerations

- **API Key Management**: The `PUBLIC_OPENROUTER_API_KEY` **must** be stored securely as an environment variable. It should never be hardcoded in the source code or committed to version control. Use `.env` files locally (added to `.gitignore`) and environment variable management tools provided by the hosting platform (e.g., Digital Ocean App Platform environment variables, Docker secrets).
- **Input Sanitization**: While the primary interaction is backend-to-OpenRouter, if user input directly forms part of the prompts sent to the API, consider potential prompt injection risks. Sanitize or carefully structure user input within prompts, especially if the LLM's output is used in security-sensitive contexts (unlikely for flashcard generation, but good practice).
- **Output Handling**: Be cautious when rendering LLM output directly to the frontend. While OpenRouter models are generally well-behaved, unexpected or improperly formatted output could occur. If rendering HTML based on output, ensure proper escaping to prevent XSS attacks. For structured JSON, validation via the Zod schema adds a layer of safety.
- **Logging**: Avoid logging the full API key or excessively detailed request/response payloads containing potentially sensitive user data in production logs unless necessary for debugging and properly secured. Log error messages, status codes, and correlation IDs instead.
- **Rate Limiting**: Be mindful of OpenRouter's rate limits. Implement client-side retries with backoff for `429 Too Many Requests` errors. Consider adding monitoring or alerting if rate limits are frequently hit.

## 7. Step-by-Step Implementation Plan

1.  **Create Service File**: Create the file `src/lib/services/openrouter.service.ts`.
2.  **Install Dependencies**: Add necessary dependencies:
    ```bash
    npm install zod zod-to-json-schema
    ```
3.  **Define Types and Error Class**: Add the `Message`, `ResponseFormat` types and the `OpenRouterError` custom error class at the top of the file.
4.  **Implement Constructor**: Create the `OpenRouterService` class and implement the constructor to load the `PUBLIC_OPENROUTER_API_KEY` from `import.meta.env`, including the check for its existence.
5.  **Implement Private Helpers**:
    - Implement `_createResponseFormat` using `zod-to-json-schema`.
    - Implement `_preparePayload` to build the request body, calling `_createResponseFormat` if a schema is provided.
    - Implement `_callApi` using `fetch`, setting headers and handling basic network errors.
    - Implement `_parseResponse`, including status checks, JSON parsing, and conditional Zod schema validation. Ensure appropriate `OpenRouterError` instances are thrown.
6.  **Implement Public Method**: Implement the `chatCompletion` method, orchestrating calls to the private helpers.
7.  **Add Environment Variable**: Add `PUBLIC_OPENROUTER_API_KEY=your_actual_api_key` to your local `.env` file (ensure `.env` is in `.gitignore`) and configure it securely in your deployment environment (Digital Ocean).
8.  **Integrate into API Route (Example)**: Create or modify an Astro API route (e.g., `src/pages/api/generate-flashcards.ts`) to use the service:

    ````typescript
    // src/pages/api/generate-flashcards.ts
    import type { APIRoute } from 'astro';
    import { z } from 'zod';
    import { OpenRouterService, OpenRouterError } from '@/lib/services/openrouter.service'; // Adjust path if needed

        // Define expected input schema
        const RequestBodySchema = z.object({
          text: z.string().min(10), // Example: User provides text to generate cards from
          count: z.number().int().positive().max(5).optional().default(3),
        });

        // Define expected output schema (for structured response)
        const FlashcardSchema = z.object({
          question: z.string().describe("The flashcard question"),
          answer: z.string().describe("The flashcard answer"),
        });
        const FlashcardListSchema = z.array(FlashcardSchema);


        // Ensure API routes are not prerendered
        export const prerender = false;

        export const POST: APIRoute = async ({ request }) => {
          let requestBody;
          try {
            const rawBody = await request.json();
            requestBody = RequestBodySchema.parse(rawBody);
          } catch (error) {
            return new Response(JSON.stringify({ error: 'Invalid request body', details: (error as Error).message }), { status: 400 });
          }

          const openRouterService = new OpenRouterService(); // Instantiated here, API key loaded internally

          const systemPrompt = `You are an expert flashcard creator. Generate ${requestBody.count} distinct question/answer pairs based on the provided text. Format the output as a JSON array of objects, where each object has a 'question' and an 'answer' key.`;
          const userPrompt = `Text:

    ${requestBody.text}`;

          try {
            const flashcards = await openRouterService.chatCompletion({
              model: 'deepseek/deepseek-chat', // Or another suitable model
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              responseSchema: FlashcardListSchema, // Request structured JSON output
              schemaName: 'flashcard_list_generator', // Name for the schema
              temperature: 0.5,
              max_tokens: 500, // Adjust as needed
            });

            // flashcards should be a validated array matching FlashcardListSchema
            return new Response(JSON.stringify({ flashcards }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });

          } catch (error) {
            console.error('Error generating flashcards:', error);
            let errorMessage = 'Failed to generate flashcards.';
            let statusCode = 500;

            if (error instanceof OpenRouterError) {
              // Potentially customize message based on error type if needed
              errorMessage = `Error communicating with AI service: ${error.message}`;
              // You could map specific OpenRouter errors (e.g., rate limits) to different status codes
            } else if (error instanceof z.ZodError) {
                errorMessage = `Invalid configuration or schema error: ${error.message}`;
                statusCode = 500; // Internal configuration issue
            }

            return new Response(JSON.stringify({ error: errorMessage }), { status: statusCode });
          }
        };
        ```
    ````
