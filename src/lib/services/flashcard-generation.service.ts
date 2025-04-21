import crypto from "crypto";
import { z } from "zod";
import type {
    FlashcardDTO,
    FlashcardInsert,
    FlashcardSuggestion,
    GeneratedFlashcardsDTO,
} from "../../types";
import { type SupabaseClient } from "../../db/supabase.client";
import { OpenRouterError, OpenRouterService } from "./openrouter.service";
import { getCurrentUserId } from "./flashcard.service";

const FlashcardSchema = z.object({
    front: z.string().describe("The flashcard question"),
    back: z.string().describe("The flashcard answer"),
});
const FlashcardListSchema = z.array(FlashcardSchema).nullish().transform(
    (val) => val ?? [],
);

interface GenerateFlashcardsOptions {
    sourceText: string;
}

/**
 * Generates flashcard suggestions from provided text using OpenRouterService
 */
export async function generateFlashcards({
    sourceText,
}: GenerateFlashcardsOptions): Promise<GeneratedFlashcardsDTO> {
    const openRouterService = new OpenRouterService();

    const systemPrompt = `
Your task is to create 10 flashcards from the text provided by the user.

IMPORTANT: You must return a valid JSON array containing exactly 10 flashcard objects with the following structure:
[
  {
    "front": "Question text goes here?",
    "back": "Answer text goes here"
  },
  ... (more flashcards)
]

Guidelines:
- Create exactly 10 flashcards
- Focus on the most important concepts from the text
- Write questions on the 'front' and answers on the 'back'
- Keep both front and back concise but informative
- Ensure your response is a valid JSON array that can be parsed
- Do not include any text outside the JSON array

REMEMBER: Your entire response must be a valid JSON array that can be parsed with JSON.parse().
`;

    const userPrompt = sourceText;
    const modelName = "google/gemma-3-27b-it:free";

    try {
        const flashcardsResult = await openRouterService.chatCompletion({
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            responseSchema: FlashcardListSchema,
            schemaName: "flashcard_list_generator",
            temperature: 0.5,
        });

        // Check if result is an array (should be, due to schema transform)
        if (!Array.isArray(flashcardsResult)) {
            console.error(
                "OpenRouter response was not the expected array format:",
                flashcardsResult,
            );
            throw new Error(
                "AI service returned an unexpected response format.",
            );
        }

        // Check if array is empty
        if (flashcardsResult.length === 0) {
            console.warn("AI service returned an empty array of flashcards.");
            throw new Error(
                "No flashcard suggestions could be generated from the provided text. Please try again with different content.",
            );
        }

        const suggestions: FlashcardSuggestion[] = flashcardsResult.map((
            card,
        ): FlashcardSuggestion => ({
            front: card.front,
            back: card.back,
            source: "AI-full",
        }));

        return {
            generation_id: crypto.randomUUID(),
            model: modelName,
            suggestions: suggestions,
            generated_count: suggestions.length,
        };
    } catch (error) {
        console.error("Error generating flashcards via OpenRouter:", error);
        if (error instanceof OpenRouterError) {
            throw new Error(
                `Failed to generate flashcards using OpenRouter: ${error.message}`,
            );
        }
        throw new Error(
            error instanceof Error
                ? error.message
                : "An unexpected error occurred during flashcard generation.",
        );
    }
}

/**
 * Stores generation results in the database
 */
export async function saveGenerationRecord(
    supabase: SupabaseClient,
    userId: string,
    sourceText: string,
    result: GeneratedFlashcardsDTO,
    generationDuration: number,
) {
    const sourceTextHash = crypto
        .createHash("md5")
        .update(sourceText)
        .digest("hex");

    // Insert generation record
    const { data, error } = await supabase
        .from("generations")
        .insert({
            id: result.generation_id,
            user_id: userId,
            model: result.model,
            generated_count: result.generated_count,
            source_text_hash: sourceTextHash,
            source_text_length: sourceText.length,
            generation_duration: Math.round(generationDuration),
            accepted_edited_count: 0,
            accepted_unedited_count: 0,
        })
        .select()
        .single();

    if (error) {
        throw new Error(
            `Failed to save generation record for user ${userId}: ${error.message}`,
        );
    }

    return data;
}

/**
 * Logs generation errors in the database
 */
export async function logGenerationError(
    supabase: SupabaseClient,
    userId: string | null | undefined,
    sourceText: string,
    model: string,
    errorCode: string,
    errorMessage: string,
) {
    if (!userId) {
        console.warn("Attempted to log generation error without a userId.");
        return;
    }

    const sourceTextHash = crypto
        .createHash("md5")
        .update(sourceText)
        .digest("hex");

    const { error } = await supabase.from("generation_error_logs").insert({
        user_id: userId,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceText.length,
        error_code: errorCode,
        error_message: errorMessage,
    });

    if (error) {
        console.error(
            `Failed to log generation error for user ${userId}:`,
            error,
        );
    }
}

/**
 * Stores generated flashcard suggestions in the database
 * @returns An object with success status and message
 */
export async function saveGeneratedFlashcards(
    supabase: SupabaseClient,
    generationId: string,
    suggestions: FlashcardSuggestion[],
): Promise<{ success: boolean; message: string; flashcards: FlashcardDTO[] }> {
    try {
        // Don't proceed if no suggestions
        if (!suggestions || suggestions.length === 0) {
            return {
                success: false,
                message: "No flashcard suggestions provided",
                flashcards: [],
            };
        }

        // Get the current user's ID
        const userId = await getCurrentUserId(supabase);

        // Convert suggestions to flashcard inserts with user_id
        const flashcardsToInsert: FlashcardInsert[] = suggestions.map(
            (suggestion) => ({
                front: suggestion.front,
                back: suggestion.back,
                source: suggestion.source,
                generation_id: generationId,
                user_id: userId,
            }),
        );

        // Insert all flashcards
        const { data, error } = await supabase
            .from("flashcards")
            .insert(flashcardsToInsert)
            .select();

        if (error) {
            console.error("Error saving flashcards:", error);
            return {
                success: false,
                message: `Failed to save flashcards: ${error.message}`,
                flashcards: [],
            };
        }

        // Transform returned data to DTOs by removing user_id
        const flashcardDTOs: FlashcardDTO[] = data.map((card) => {
            const { user_id, ...flashcardDTO } = card;
            return flashcardDTO;
        });

        return {
            success: true,
            message: `Successfully saved ${flashcardDTOs.length} flashcards`,
            flashcards: flashcardDTOs,
        };
    } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error occurred";
        console.error("Error in saveGeneratedFlashcards:", errorMessage);
        return {
            success: false,
            message: errorMessage,
            flashcards: [],
        };
    }
}
