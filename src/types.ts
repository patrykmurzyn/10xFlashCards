// Import the database types
import type { Database } from "./db/database.types";

/**
 * Aliases for main database entities
 */
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardInsert =
    Database["public"]["Tables"]["flashcards"]["Insert"];
export type FlashcardUpdate =
    Database["public"]["Tables"]["flashcards"]["Update"];

export type Generation = Database["public"]["Tables"]["generations"]["Row"];
export type GenerationErrorLog =
    Database["public"]["Tables"]["generation_error_logs"]["Row"];

/**
 * Enum for flashcard source values.
 */
export type FlashcardSource = "manual" | "ai-full" | "ai-edited";

/**
 * DTO for Flashcard responses.
 * Contains only the fields exposed via API (omitting user_id).
 */
export type FlashcardDTO = Omit<Flashcard, "user_id">;

/**
 * DTO for creating a flashcard.
 * Note: For 'manual' source, generation_id must be null; for 'AI-full' or 'AI-edited', generation_id is required.
 */
export type CreateFlashcardDTO = Pick<
    FlashcardInsert,
    "front" | "back" | "source" | "generation_id"
>;

/**
 * Command model for creating one or multiple flashcards.
 */
export interface CreateFlashcardsCommand {
    flashcards: CreateFlashcardDTO[];
}

/**
 * Command model for updating a flashcard.
 * Only editable fields are allowed.
 */
export type UpdateFlashcardCommand = Pick<
    FlashcardUpdate,
    "front" | "back" | "source"
>;

/**
 * Command model for triggering flashcard generation from a block of text.
 */
export interface GenerateFlashcardsCommand {
    source_text: string;
    num_cards?: number;
}

/**
 * DTO for a generated flashcard suggestion.
 * In generation responses, the 'source' field is always set to 'ai-full'.
 */
export interface FlashcardSuggestion {
    front: string;
    back: string;
    source: "ai-full";
}

/**
 * DTO for the response of flashcard generation.
 */
export interface GeneratedFlashcardsDTO {
    generation_id: string;
    model: string;
    suggestions: FlashcardSuggestion[];
    generated_count: number;
}

/**
 * DTO for a generation session.
 */
export type GenerationSessionDTO = Pick<
    Generation,
    | "id"
    | "model"
    | "generated_count"
    | "accepted_unedited_count"
    | "accepted_edited_count"
    | "created_at"
>;

/**
 * DTO for a generation error log.
 */
export type GenerationErrorLogDTO = Pick<
    GenerationErrorLog,
    "id" | "model" | "error_code" | "error_message" | "created_at"
>;

/**
 * Generic interface for paginated responses.
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatParams {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    [key: string]: any;
}

export interface ResponseFormat {
    type: "json_schema";
    json_schema: {
        name: string;
        strict: boolean;
        schema: object;
    };
}

export interface ChatOptions {
    model?: string;
    params?: ChatParams;
    format?: ResponseFormat;
}

export interface ChatResponse<T = any> {
    data: T;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface OpenRouterRequestPayload {
    model: string;
    messages: ChatMessage[];
    parameters: ChatParams;
    response_format: ResponseFormat;
}
