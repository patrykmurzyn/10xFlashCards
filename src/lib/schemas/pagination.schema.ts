import { z } from "zod";

/**
 * Generic schema for validating pagination and sorting query parameters.
 * Can be used across different API endpoints that require pagination.
 */
export const paginationSchema = z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort_by: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
});

/**
 * Helper function to parse pagination parameters with defaults
 */
export function parsePaginationParams(
    params: z.infer<typeof paginationSchema>,
) {
    const page = params.page ? parseInt(params.page, 10) : 1;
    const limit = params.limit ? parseInt(params.limit, 10) : 10;
    const sortBy = params.sort_by || "created_at";
    const order = params.order || "desc";

    return {
        page,
        limit,
        sortBy,
        order,
        offset: (page - 1) * limit,
    };
}
