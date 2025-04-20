import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

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
        const apiKey = import.meta.env.OPENROUTER_API_KEY;
        if (!apiKey || typeof apiKey !== "string") {
            console.error(
                "OpenRouter API key is missing or invalid. Please set OPENROUTER_API_KEY environment variable.",
            );
            throw new OpenRouterError(
                "Missing OpenRouter API Key configuration.",
            );
        }
        this.apiKey = apiKey;
        // Optional: Allow overriding base URL via env var if needed
        // this.apiBaseUrl = import.meta.env.OPENROUTER_API_BASE_URL || this.apiBaseUrl;
    }

    // ... public and private methods will follow ...

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
        const payload = this._preparePayload(options);
        const response = await this._callApi("/chat/completions", payload);
        return this._parseResponse(response, options.responseSchema);
    }

    private _createResponseFormat(
        schema: z.ZodTypeAny,
        name: string,
    ): ResponseFormat {
        try {
            // Convert Zod schema to JSON schema object
            // The 'name' parameter in zodToJsonSchema might not be directly used by OpenRouter's format,
            // but it's part of the library's API. We use the provided 'name' for OpenRouter's schema name field.
            const jsonSchema = zodToJsonSchema(schema, name);

            return {
                type: "json_schema",
                json_schema: {
                    name: name, // Name required by OpenRouter
                    strict: true, // Enforce schema adherence
                    schema: jsonSchema, // The generated JSON schema structure
                },
            };
        } catch (error) {
            console.error(
                "Failed to convert Zod schema to JSON schema:",
                error,
            );
            throw new OpenRouterError(
                "Invalid response schema provided.",
                error,
            );
        }
    }

    private _preparePayload(options: any): object {
        const { model, messages, responseSchema, schemaName, ...restParams } =
            options;

        const payload: any = {
            model,
            messages,
            ...restParams, // Include temperature, max_tokens etc.
        };

        if (responseSchema) {
            if (!schemaName) {
                throw new OpenRouterError(
                    "schemaName is required when responseSchema is provided.",
                );
            }
            payload.response_format = this._createResponseFormat(
                responseSchema,
                schemaName,
            );
        }

        return payload;
    }

    private async _callApi(
        endpoint: string,
        payload: object,
    ): Promise<Response> {
        const url = `${this.apiBaseUrl}${endpoint}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    // Optional: Add 'HTTP-Referer': your_site_url, 'X-Title': your_app_name
                    // See OpenRouter docs for recommended headers
                },
                body: JSON.stringify(payload),
            });
            return response;
        } catch (error) {
            console.error(
                `Network error calling OpenRouter API: ${endpoint}`,
                error,
            );
            throw new OpenRouterError(
                `Network error communicating with OpenRouter: ${
                    (error as Error).message
                }`,
                error,
            );
        }
    }

    private async _parseResponse<T extends z.ZodTypeAny>(
        response: Response,
        schema?: T,
    ): Promise<string | z.infer<T>> {
        if (!response.ok) {
            let errorBody = `Status: ${response.status}`;
            try {
                const errorJson = await response.json();
                errorBody += `, Body: ${JSON.stringify(errorJson)}`;
            } catch (e) { /* Ignore if error body isn't valid JSON */ }
            console.error(`OpenRouter API error: ${errorBody}`);
            throw new OpenRouterError(
                `OpenRouter API error: ${response.status} ${response.statusText}`,
            );
        }

        let responseData: any;
        try {
            responseData = await response.json();
        } catch (error) {
            console.error(
                "Failed to parse JSON response from OpenRouter:",
                error,
            );
            throw new OpenRouterError(
                "Invalid JSON response received from OpenRouter.",
                error,
            );
        }

        const messageContent = responseData?.choices?.[0]?.message?.content;
        if (typeof messageContent !== "string") {
            console.error(
                "Invalid response structure from OpenRouter:",
                responseData,
            );
            throw new OpenRouterError(
                "Unexpected response structure received from OpenRouter.",
            );
        }

        // Log the raw content for debugging before parsing/validation
        console.log("--- OpenRouter Raw Response Content ---");
        console.log(messageContent);
        console.log("---------------------------------------");

        if (schema) {
            try {
                let parsedJson = JSON.parse(messageContent);

                // Sprawdź, czy parsedJson jest ciągiem znaków, który wygląda jak JSON (zaczyna się od [ lub {)
                if (
                    typeof parsedJson === "string" &&
                    (parsedJson.trim().startsWith("[") ||
                        parsedJson.trim().startsWith("{"))
                ) {
                    console.log(
                        "Wykryto JSON string wewnątrz odpowiedzi - parsowanie drugi raz",
                    );
                    try {
                        // Spróbuj sparsować jeszcze raz - model może zwrócić string zawierający JSON
                        parsedJson = JSON.parse(parsedJson);
                    } catch (innerError) {
                        console.error(
                            "Nie udało się sparsować wewnętrznego JSON:",
                            innerError,
                        );
                        // Kontynuuj z oryginalnym parsedJson jeśli drugi parsing nie zadziała
                    }
                }

                // Dodaj check: Jeśli schema oczekuje tablicy/obiektu, ale parsedJson jest null lub nie jest obiektem
                if (parsedJson === null || typeof parsedJson !== "object") {
                    // Sprawdź czy schema oczekuje null, w przeciwnym wypadku to błąd
                    const expectedType = schema._def.typeName;
                    if (expectedType !== "ZodNull") {
                        console.error(
                            `Parsed JSON is ${
                                parsedJson === null ? "null" : typeof parsedJson
                            }, but schema expected ${expectedType}. Content:`,
                            messageContent,
                        );
                        throw new OpenRouterError(
                            `AI response content could not be parsed into the expected structure (${expectedType}).`,
                        );
                    }
                }

                // Validate the parsed JSON against the Zod schema
                const validationResult = schema.safeParse(parsedJson);
                if (!validationResult.success) {
                    console.error(
                        "OpenRouter response failed schema validation:",
                        validationResult.error,
                    );
                    // Include the problematic content in the error for easier debugging
                    throw new OpenRouterError(
                        `Response failed schema validation. Content: ${messageContent}`,
                        validationResult.error,
                    );
                }
                return validationResult.data; // Return validated data
            } catch (error) {
                if (error instanceof OpenRouterError) throw error; // Re-throw validation error
                console.error(
                    "Failed to parse or validate structured response content:",
                    error,
                    "Content:",
                    messageContent,
                );
                throw new OpenRouterError(
                    `Failed to parse response content as expected JSON. Content: ${messageContent}`,
                    error,
                );
            }
        } else {
            return messageContent; // Return plain string content
        }
    }
}
