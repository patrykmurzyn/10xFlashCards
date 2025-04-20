import type { SupabaseClient } from "../../db/supabase.client";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { GenerationSessionDTO, PaginatedResponse } from "../../types";

/**
 * Retrieves a paginated list of generation sessions for a user.
 *
 * @param supabase - The Supabase client instance from context.locals.
 * @param page - The page number (starts at 1).
 * @param limit - The number of items per page.
 * @param userId - The user id who owns the generations (defaults to DEFAULT_USER_ID).
 * @returns Paginated response with generation sessions.
 */
export async function listGenerationSessions(
    supabase: SupabaseClient,
    page: number = 1,
    limit: number = 10,
    userId: string = DEFAULT_USER_ID,
): Promise<PaginatedResponse<GenerationSessionDTO>> {
    // Calculate the offset from page and limit
    const offset = (page - 1) * limit;

    // Query the generations table
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
        throw new Error(`Database error: ${error.message}`);
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
