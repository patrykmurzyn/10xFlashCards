import type { APIRoute } from "astro";
import {
    paginationSchema,
    parsePaginationParams,
} from "../../../lib/schemas/pagination.schema";
import type { GenerationSessionDTO, PaginatedResponse } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { listGenerationSessions } from "../../../lib/services/generation.service";

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
    const { page, limit } = parsePaginationParams(parseResult.data);

    try {
        // Call the service to get the paginated list of generation sessions
        const response = await listGenerationSessions(
            supabase,
            page,
            limit,
            userId,
        );

        // Return the successful response
        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error retrieving generation sessions:", error);

        if (error.message.startsWith("Database error:")) {
            return new Response(
                JSON.stringify({
                    error: "Database error",
                    details: error.message.replace("Database error: ", ""),
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Handle other errors
        return new Response(
            JSON.stringify({
                error: "Internal Server Error",
                message: error.message || "An unexpected error occurred",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
};
