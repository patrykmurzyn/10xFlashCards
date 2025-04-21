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
    // Ensure we have the supabase client and user session/id
    const supabase = locals.supabase;
    const session = locals.session;
    const userId = session?.user?.id;

    // Store request data in variable accessible in catch block
    let requestData: any;
    let sourceTextForErrorLog: string = "";

    try {
        // User must be authenticated to generate flashcards
        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

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
        sourceTextForErrorLog = source_text; // Store for potential error logging

        // Start timing the generation process
        const startTime = performance.now();

        // Call the flashcard generation service
        const result = await generateFlashcards({
            sourceText: source_text,
        });

        // Check if result contains suggestions
        if (!result.suggestions || result.suggestions.length === 0) {
            console.warn(
                "Flashcard generation returned empty suggestions array",
            );
            return new Response(
                JSON.stringify({
                    error: "Generation produced no results",
                    code: GenerationErrorCode.EMPTY_RESULTS,
                    message:
                        "No flashcard suggestions could be generated. Please try with different text.",
                }),
                {
                    status: 422,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Log successful generation
        console.log(
            `Successfully generated ${result.generated_count} flashcards`,
        );

        // Calculate generation duration
        const generationDuration = performance.now() - startTime;

        // Store generation record in the database with the user ID
        await saveGenerationRecord(
            supabase,
            userId, // Pass the actual userId
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

        // Determine model identifier - use a default if not available in error context
        // TODO: Refine how model identifier is retrieved/passed in case of errors
        const modelIdentifier = "deepseek/deepseek-chat-v3-0324:free";

        try {
            // Pass userId to logGenerationError
            await logGenerationError(
                supabase,
                userId, // Pass the userId (can be null/undefined if auth failed early)
                sourceTextForErrorLog, // Use stored source text
                modelIdentifier,
                errorCode,
                errorMessage,
            );
        } catch (logError) {
            // Don't let logging failure mask the original error, just log it.
            console.error("Failed to log generation error:", logError);
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
