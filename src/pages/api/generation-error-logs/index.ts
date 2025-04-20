import type { APIRoute } from "astro";
import {
    paginationSchema,
    parsePaginationParams,
} from "../../../lib/schemas/pagination.schema";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
    const supabase = locals.supabase;

    // Parse query parameters
    const url = new URL(request.url);
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

    try {
        const { data, count, error } = await supabase
            .from("generation_error_logs")
            .select("*", { count: "exact" })
            .eq("user_id", DEFAULT_USER_ID) // Filter logs for default user (authentication omitted for now)
            .order(sortBy, { ascending: order === "asc" })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(error.message);
        }

        return new Response(
            JSON.stringify({ data, pagination: { page, limit, total: count } }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (err: any) {
        console.error("Error fetching generation error logs:", err);

        return new Response(
            JSON.stringify({
                error: "Internal Server Error",
                message: err.message || "An error occurred while fetching logs",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
};
