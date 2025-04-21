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
    private defaultMaxTokens: number = 4096; // Set a higher default max_tokens

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
        max_tokens?: number; // Allow overriding default
        // Add other valid OpenRouter parameters as needed
    }): Promise<string | z.infer<T>> {
        try {
            // Use provided max_tokens or the higher default
            const maxTokens = options.max_tokens ?? this.defaultMaxTokens;
            const optionsWithDefaults = { ...options, max_tokens: maxTokens };

            // When using structured outputs, add a system message hint about the expected format if one doesn't exist
            if (
                optionsWithDefaults.responseSchema &&
                !optionsWithDefaults.messages.some((msg) =>
                    msg.role === "system"
                )
            ) {
                // Add a system message that explicitly tells the model to return raw JSON
                optionsWithDefaults.messages.unshift({
                    role: "system",
                    content:
                        "Return ONLY the raw JSON response conforming to the specified schema with no markdown formatting, code blocks, or additional text.",
                });
                console.log("Added system message to ensure raw JSON response");
            }

            const payload = this._preparePayload(optionsWithDefaults);
            console.log(
                `Sending request to OpenRouter model: ${optionsWithDefaults.model} with max_tokens: ${optionsWithDefaults.max_tokens}`,
            );

            // If using schema, log relevant information
            if (
                optionsWithDefaults.responseSchema &&
                optionsWithDefaults.schemaName
            ) {
                console.log(
                    `Using schema: ${optionsWithDefaults.schemaName} for structured output`,
                );
            }

            const response = await this._callApi(
                "/chat/completions",
                payload,
            );
            return this._parseResponse(
                response,
                optionsWithDefaults.responseSchema,
            );
        } catch (error) {
            console.error("Error in OpenRouter chatCompletion:", error);
            if (error instanceof OpenRouterError) {
                throw error;
            }
            throw new OpenRouterError(
                `Failed to get response from OpenRouter: ${
                    (error as Error).message
                }`,
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

            // Ensure we're setting up the response_format correctly according to OpenRouter docs
            // Using the exact format from their documentation
            const jsonSchema = zodToJsonSchema(responseSchema, schemaName);

            payload.response_format = {
                type: "json_schema",
                json_schema: {
                    name: schemaName,
                    strict: true,
                    schema: jsonSchema,
                },
            };

            // Log the schema being sent for debugging
            console.log(
                "Using schema for structured output:",
                JSON.stringify(payload.response_format, null, 2),
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
            let parsedJson: any;
            try {
                // First, handle the case where the response is wrapped in markdown code blocks
                let contentToParse = messageContent.trim(); // Trim whitespace from the raw message
                let extracted = false;

                // Refined regex: Anchored, flexible whitespace, greedy capture
                const codeBlockMatch = contentToParse.match(
                    /^```(?:json)?\s*([\s\S]*?)\s*```$/,
                );

                if (codeBlockMatch && codeBlockMatch[1]) {
                    contentToParse = codeBlockMatch[1].trim(); // Trim the extracted content specifically
                    extracted = true;
                    console.log(
                        "Extracted content from code block:",
                        contentToParse,
                    );
                } else {
                    // If it wasn't a code block, keep the trimmed original messageContent
                    console.log(
                        "No code block detected or regex failed. Attempting to parse trimmed original content.",
                    );
                }

                // Check if the potentially extracted content is empty
                if (!contentToParse) {
                    throw new OpenRouterError(
                        "After processing, the content to parse is empty.",
                    );
                }

                // Log the exact content being parsed, escaping control characters for visibility
                console.log(
                    "Attempting to parse content:",
                    JSON.stringify(contentToParse),
                );

                // --- Attempt to parse the cleaned content ---
                try {
                    parsedJson = JSON.parse(contentToParse);
                } catch (parseError) {
                    console.error("Initial parsing failed:", parseError);
                    // If extraction happened but failed, maybe the original message was actually valid JSON?
                    if (extracted) {
                        console.warn(
                            "Parsing extracted content failed. Retrying with original trimmed message content.",
                        );
                        try {
                            const originalTrimmedContent = messageContent
                                .trim();
                            console.log(
                                "Retrying parse with original trimmed content:",
                                JSON.stringify(originalTrimmedContent),
                            );
                            parsedJson = JSON.parse(originalTrimmedContent);
                        } catch (retryParseError) {
                            console.error(
                                "Retry parsing with original content also failed:",
                                retryParseError,
                            );
                            // Throw the original error if retry also fails, including original content
                            throw new OpenRouterError(
                                `Failed to parse AI response content as JSON, even after attempting to handle code blocks. Original Content: ${messageContent}`,
                                parseError, // Keep the first error as the primary cause
                            );
                        }
                    } else {
                        // If extraction didn't happen and parsing failed, throw the original error
                        throw new OpenRouterError(
                            `Failed to parse AI response content as JSON. Content: ${messageContent}`,
                            parseError,
                        );
                    }
                }

                // Add check for null response and log it
                if (parsedJson === null) {
                    console.warn(
                        "OpenRouter returned null content. Attempting to proceed with validation.",
                    );
                }

                // Validate the final parsed JSON against the Zod schema
                const validationResult = schema.safeParse(parsedJson);
                if (!validationResult.success) {
                    console.error(
                        "OpenRouter response failed schema validation:",
                        validationResult.error.flatten(), // Use flatten for better readability
                        "Parsed JSON:",
                        parsedJson, // Log the JSON that failed validation
                    );
                    // Include the problematic content in the error for easier debugging
                    throw new OpenRouterError(
                        `Response failed schema validation. Parsed Content: ${
                            JSON.stringify(parsedJson)
                        }`,
                        validationResult.error,
                    );
                }
                // Return validated data
                return validationResult.data;
            } catch (error) {
                if (error instanceof OpenRouterError) throw error; // Re-throw specific errors

                // Handle general JSON parsing errors (e.g., from the first parse)
                if (error instanceof SyntaxError) {
                    console.error(
                        "Failed to parse initial JSON response content:",
                        error,
                        "Content:",
                        messageContent,
                    );
                    throw new OpenRouterError(
                        `Failed to parse AI response content as JSON. Content: ${messageContent}`,
                        error,
                    );
                }

                // Handle other unexpected errors during parsing/validation
                console.error(
                    "Unexpected error during response processing:",
                    error,
                    "Content:",
                    messageContent,
                );
                throw new OpenRouterError(
                    `An unexpected error occurred while processing the AI response. Content: ${messageContent}`,
                    error,
                );
            }
        } else {
            // Return plain string content if no schema is provided
            return messageContent;
        }
    }
}
