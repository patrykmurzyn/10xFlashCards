# DeepSeek Service Implementation Plan

## 1. Description of the Service

The `DeepSeekService` provides a TypeScript wrapper over the DeepSeek Chat Completion API (OpenAI compatible), enabling seamless integration of LLM-powered chat agents into the 10xFlashCards application. It is responsible for constructing requests with system and user messages, enforcing a JSON response format, selecting the model, setting model parameters, and parsing & validating responses.

## 2. Constructor

```ts
constructor(options: {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  defaultParams?: ChatParams;
})
```

- **apiKey**: Your DeepSeek API key (required).
- **baseUrl**: Base URL of the DeepSeek API (default: `https://api.deepseek.com/v1`).
- **defaultModel**: Default LLM model name (e.g., `deepseek-chat`).
- **defaultParams**: Default model parameters (temperature, max_tokens, etc.).

## 3. Public Methods and Fields

### Methods

- `async sendChatCompletion(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse>`

  - Sends a chat completion request.
  - **messages**: Array of system/user messages.
  - **options**: Overrides for model, parameters, and response format (specifically `response_format: { type: 'json_object' }` for JSON).

- `setApiKey(key: string): void`

  - Updates the API key at runtime.

- `setModel(model: string): void`
  - Overrides the default model.

### Fields

- `apiKey: string`
- `baseUrl: string`
- `defaultModel: string`
- `defaultParams: ChatParams`

### Configuration Examples

1. **System Message**

```json
{
  "role": "system",
  "content": "You are a helpful assistant specialized in generating concise flashcards. Respond in JSON format."
}
```

(Note: Ensure "json" is mentioned in the system or user prompt when using `json_object` format).

2. **User Message**

```json
{
  "role": "user",
  "content": "Generate flashcards about the process of photosynthesis."
}
```

3. **Response Format Parameter**

```ts
const responseFormat = { type: "json_object" };
```

(This needs to be passed in the request payload when JSON output is required).

4. **Model Name**

```ts
const modelName = "deepseek-chat"; // Or "deepseek-reasoner"
```

5. **Model Parameters**

```ts
const modelParams = { temperature: 0.7, max_tokens: 1500 }; // Adjust max_tokens as needed for JSON output
```

## 4. Private Methods and Fields

- `_buildPayload(messages: ChatMessage[], options: ChatOptions): DeepSeekRequestPayload`

  - Constructs the HTTP request payload compatible with the DeepSeek/OpenAI API, including `response_format` if specified.

- `_parseResponse(response: unknown): ChatResponse`

  - Parses the JSON response from DeepSeek. Since `json_object` mode guarantees valid JSON, primary validation is handled by standard JSON parsing. Zod can be used on the parsed object for structure validation.

- `_handleError(error: unknown): never`

  - Normalizes and throws custom errors based on HTTP status or parsing failure.

- `_httpClient: HttpClient`

  - Underlying HTTP client instance configured with interceptors for auth and logging.

## 5. Error Handling

1. **Network Failure**: Timeout or DNS errors
   - Throw `NetworkError` with retry logic support.
2. **Authentication Error (401)**
   - Throw `AuthenticationError`; prompt user to refresh API key.
3. **Rate Limiting (429)**
   - Throw `RateLimitError`; implement exponential backoff.
4. **API Error (5xx or non-JSON response when not expected)**
   - Throw `ApiError` with status and message.
5. **JSON Parsing/Validation Failure**
   - Throw `ValidationError`; log raw response for debugging.

## 6. Security Considerations

- Securely store `DEEPSEEK_API_KEY` in environment variables (`import.meta.env`).
- Use HTTPS (TLS) for all API communication.
- Do not log sensitive data (API keys, user messages).
- Validate inputs to prevent injection attacks.
- Enforce rate limits and timeouts to mitigate abuse.

## 7. Step-by-Step Deployment Plan

1. **Install Dependencies**
   ```bash
   npm install openai # Or use node-fetch if implementing manually
   npm install zod
   ```
   (Consider using the official OpenAI SDK as DeepSeek is compatible).
2. **Configure Environment**
   - Add `DEEPSEEK_API_KEY` and optionally `DEEPSEEK_BASE_URL` (if not using default) to `.env`.
3. **Define Types**
   - Update `ChatOptions` in `src/types.ts` if needed to accommodate `response_format`. `ChatResponse` likely remains similar structure but source data format changes.
4. **Create Service File**
   - Path: `src/lib/services/DeepSeekService.ts`
   - Implement constructor, public & private methods per sections 2–4, potentially using the `openai` package.
5. **Implement Validation**
   - Use Zod to validate the _parsed_ JSON response structure if needed.
6. **Write Unit Tests**
   - Add tests in `src/__tests__/DeepSeekService.test.ts` to cover success & error cases, mocking API calls.
7. **Integrate into Astro**
   - Import and instantiate `DeepSeekService` in relevant API routes (e.g., `src/pages/api/chat.ts`).
   - Ensure `response_format: { type: 'json_object' }` is passed when needed.
   - Use `export const POST` handler with `await service.sendChatCompletion(...)`.
8. **Perform End-to-End Testing**
   - Test with mock and real API keys; verify JSON response structure.
9. **Set Up CI/CD**
   - Configure GitHub Actions to export `DEEPSEEK_API_KEY` environment var and run tests.
   - Use DigitalOcean Docker deployment; pass environment vars securely.
10. **Monitoring & Logging**

- Add basic metrics (request count, latency, errors) via your observability stack.

---

_This implementation plan is tailored for 10xFlashCards' Astro + React + TypeScript stack, leveraging the DeepSeek API (OpenAI compatible) with Zod for validation, and following best practices for error handling and security._
