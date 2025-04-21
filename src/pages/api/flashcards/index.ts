import type { APIRoute } from "astro";
import {
    paginationSchema,
    parsePaginationParams,
} from "../../../lib/schemas/pagination.schema";
import type { FlashcardDTO, PaginatedResponse } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { createFlashcards } from "../../../lib/services/flashcard.service";
import { createFlashcardsCommandSchema } from "../../../lib/schemas/flashcard.schema";
import { z } from "zod";

// Disable prerendering for this API route
export const prerender = false;

// Schema for query parameters
const QuerySchema = z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        // Parse and validate query parameters
        const url = new URL(request.url);
        const searchParams = Object.fromEntries(url.searchParams.entries());
        const { page, limit } = QuerySchema.parse(searchParams);

        // Get user from session
        const { supabase, session } = locals;
        if (!session?.user) {
            return new Response(
                JSON.stringify({ message: "Unauthorized" }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const userId = session.user.id;
        const offset = (page - 1) * limit;

        // Calculate total count of user's flashcards
        const { count, error: countError } = await supabase
            .from("flashcards")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);

        if (countError) {
            console.error("Error counting flashcards:", countError);
            return new Response(
                JSON.stringify({ message: "Failed to count flashcards" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Fetch paginated flashcards
        const { data, error } = await supabase
            .from("flashcards")
            .select(
                "id, front, back, source, generation_id, created_at, updated_at",
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Error fetching flashcards:", error);
            return new Response(
                JSON.stringify({ message: "Failed to fetch flashcards" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Prepare paginated response
        const response: PaginatedResponse<FlashcardDTO> = {
            data: data,
            pagination: {
                page,
                limit,
                total: count || 0,
            },
        };

        return new Response(
            JSON.stringify(response),
            { headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("API error:", error);
        return new Response(
            JSON.stringify({
                message: error instanceof Error
                    ? error.message
                    : "Internal server error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    // Extract the Supabase client and session from locals
    const { supabase, session } = locals;

    try {
        // Check if user is authenticated
        if (!session?.user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const userId = session.user.id;

        // Parse and validate request body
        const requestData = await request.json();
        const validationResult = createFlashcardsCommandSchema.safeParse(
            requestData,
        );

        if (!validationResult.success) {
            // Handle validation errors
            const errors = validationResult.error.flatten();
            return new Response(
                JSON.stringify({
                    error: "Validation Error",
                    details: errors,
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Call the service to create the flashcards with the authenticated user's ID
        const result = await createFlashcards(
            supabase,
            validationResult.data.flashcards,
            userId,
        );

        // Check if any flashcards were actually created
        if (result.data.length === 0) {
            // If all flashcards failed to save
            return new Response(
                JSON.stringify({
                    error: "Failed to save flashcards",
                    details: result.failed,
                }),
                {
                    status: 422,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Return successful response with 201 Created status
        return new Response(JSON.stringify(result), {
            status: 201,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        console.error("Error creating flashcards:", error);

        // Return error response
        return new Response(
            JSON.stringify({
                error: "Internal Server Error",
                message: error.message || "An unexpected error occurred",
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
