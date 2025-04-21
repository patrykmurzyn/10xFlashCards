import type { SupabaseClient } from "../../db/supabase.client";
import type { GenerationSessionDTO, PaginatedResponse } from "../../types";

/**
 * Retrieves a paginated list of generation sessions for a user.
 *
 * @param supabase - The Supabase client instance from context.locals.
 * @param page - The page number (starts at 1).
 * @param limit - The number of items per page.
 * @param userId - The user id who owns the generations.
 * @returns Paginated response with generation sessions.
 */
export async function listGenerationSessions(
    supabase: SupabaseClient,
    userId: string,
    page: number = 1,
    limit: number = 10,
): Promise<PaginatedResponse<GenerationSessionDTO>> {
    // Ensure userId is provided
    if (!userId) {
        throw new Error("User ID is required to list generation sessions.");
    }

    // Calculate the offset from page and limit
    const offset = (page - 1) * limit;

    // Query the generations table using the provided userId
    const { data, error, count } = await supabase
        .from("generations")
        .select(
            "id, model, generated_count, accepted_unedited_count, accepted_edited_count, created_at",
            { count: "exact" },
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(
            `Database error fetching generations for user ${userId}: ${error.message}`,
        );
    }

    // Construct the paginated response
    return {
        data: data || [],
        pagination: {
            page,
            limit,
            total: count || 0,
        },
    };
}
