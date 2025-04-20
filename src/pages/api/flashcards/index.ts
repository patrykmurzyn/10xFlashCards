import type { APIRoute } from "astro";
import {
    paginationSchema,
    parsePaginationParams,
} from "../../../lib/schemas/pagination.schema";
import type { FlashcardDTO, PaginatedResponse } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { createFlashcards } from "../../../lib/services/flashcard.service";
import { createFlashcardsCommandSchema } from "../../../lib/schemas/flashcard.schema";

// Disable prerendering for this API route
export const prerender = false;

export const GET: APIRoute = async ({ request, url, locals }) => {
    // Extract the Supabase client from locals
    const supabase = locals.supabase;

    // For testing, use default user from supabase client
    const userId = DEFAULT_USER_ID;

    // Parse query parameters from the URL
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parseResult = paginationSchema.safeParse(queryParams);
    if (!parseResult.success) {
        return new Response(
            JSON.stringify({
                error: "Invalid query parameters",
                details: parseResult.error.flatten(),
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    // Use the helper function to parse pagination parameters
    const { page, limit, sortBy, order, offset } = parsePaginationParams(
        parseResult.data,
    );

    // Query the flashcards for the authenticated user with pagination and sorting
    const { data, error, count } = await supabase
        .from("flashcards")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order(sortBy, { ascending: order === "asc" })
        .range(offset, offset + limit - 1);

    if (error) {
        return new Response(
            JSON.stringify({ error: "Database error", details: error.message }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    // Transform flashcards to FlashcardDTO by omitting the user_id field
    const flashcardsDTO: FlashcardDTO[] = (data || []).map((flashcard: any) => {
        const { user_id, ...rest } = flashcard;
        return rest;
    });

    const responseBody: PaginatedResponse<FlashcardDTO> = {
        data: flashcardsDTO,
        pagination: {
            page,
            limit,
            total: count || 0,
        },
    };

    return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

export const POST: APIRoute = async ({ request, locals }) => {
    // Extract the Supabase client from locals
    const supabase = locals.supabase;

    try {
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

        // For testing, use default user from supabase client
        const userId = DEFAULT_USER_ID;

        // Call the service to create the flashcards
        const result = await createFlashcards(
            supabase,
            validationResult.data.flashcards,
            userId,
        );

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
