import crypto from "crypto";
import { z } from "zod";
import type { FlashcardSuggestion, GeneratedFlashcardsDTO } from "../../types";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { SupabaseClient } from "../../db/supabase.client";
import { OpenRouterError, OpenRouterService } from "./openrouter.service";

const FlashcardSchema = z.object({
    front: z.string().describe("The flashcard question"),
    back: z.string().describe("The flashcard answer"),
});
const FlashcardListSchema = z.array(FlashcardSchema);

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

    const systemPrompt =
        "Na podstawie dostarczonego tekstu zidentyfikuj 10 najważniejszych rzeczy wartych zapamiętania. Zwróć je jako tablicę obiektów JSON, gdzie każdy obiekt ma pola 'front' i 'back' reprezentujące każdą fiszkę. Pole 'front' powinno zawierać pytanie, a pole 'back' odpowiedź.";

    const userPrompt = sourceText;
    const modelName = "google/gemini-flash-1.5";

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
            max_tokens: 1000,
        });

        if (!Array.isArray(flashcardsResult)) {
            console.error(
                "OpenRouter response was not the expected array format:",
                flashcardsResult,
            );
            throw new Error(
                "AI service returned an unexpected response format.",
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
            "An unexpected error occurred during flashcard generation.",
        );
    }
}

/**
 * Stores generation results in the database
 */
export async function saveGenerationRecord(
    supabase: SupabaseClient,
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
            user_id: DEFAULT_USER_ID,
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
        throw new Error(`Failed to save generation record: ${error.message}`);
    }

    return data;
}

/**
 * Logs generation errors in the database
 */
export async function logGenerationError(
    supabase: SupabaseClient,
    sourceText: string,
    model: string,
    errorCode: string,
    errorMessage: string,
) {
    const sourceTextHash = crypto
        .createHash("md5")
        .update(sourceText)
        .digest("hex");

    const { error } = await supabase.from("generation_error_logs").insert({
        user_id: DEFAULT_USER_ID,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceText.length,
        error_code: errorCode,
        error_message: errorMessage,
    });

    if (error) {
        console.error("Failed to log generation error:", error);
    }
}
