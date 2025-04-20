import type { APIRoute } from "astro";
import {
    generateFlashcardsSchema,
    GenerationErrorCode,
} from "../../../lib/schemas/flashcard-generation.schema";
import {
    generateFlashcards,
    logGenerationError,
    saveGenerationRecord,
} from "../../../lib/services/flashcard-generation.service";

// Disable prerendering for this API route
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    const supabase = locals.supabase;

    // Store request data in variable accessible in catch block
    let requestData: any;

    try {
        // Parse and validate request body
        requestData = await request.json();
        const validationResult = generateFlashcardsSchema.safeParse(
            requestData,
        );

        if (!validationResult.success) {
            // Handle validation errors
            const errors = validationResult.error.flatten();
            return new Response(
                JSON.stringify({
                    error: "Validation Error",
                    code: GenerationErrorCode.VALIDATION_ERROR,
                    details: errors,
                }),
                {
                    status: 422,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const { source_text } = validationResult.data;

        // Start timing the generation process
        const startTime = performance.now();

        // Call the flashcard generation service (currently mock implementation)
        const result = await generateFlashcards({
            sourceText: source_text,
        });

        // Calculate generation duration
        const generationDuration = performance.now() - startTime;

        // Store generation record in the database
        await saveGenerationRecord(
            supabase,
            source_text,
            result,
            generationDuration,
        );

        // Return successful response
        return new Response(JSON.stringify(result), {
            status: 201,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("Error generating flashcards:", error);

        // Log the error to the database
        const errorCode = error.code || GenerationErrorCode.UNKNOWN_ERROR;
        const errorMessage = error.message || "An unknown error occurred";

        try {
            await logGenerationError(
                supabase,
                requestData?.source_text || "",
                "deepseek/deepseek-chat-v3-0324:free", // Default model identifier for error logging
                errorCode,
                errorMessage,
            );
        } catch (logError) {
            console.error("Failed to log error:", logError);
        }

        // Return error response
        return new Response(
            JSON.stringify({
                error: "Internal Server Error",
                code: errorCode,
                message: errorMessage,
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
    }
};
