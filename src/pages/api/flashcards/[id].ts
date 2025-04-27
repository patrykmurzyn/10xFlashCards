import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import {
    deleteFlashcard,
    getFlashcard,
    updateFlashcard,
} from "../../../lib/services/flashcard.service";
import { uuidSchema } from "../../../lib/schemas/uuid.schema";
import { updateFlashcardSchema } from "../../../lib/schemas/flashcard.schema";
import type { FlashcardDTO } from "../../../types";
import { z } from "zod";

export const prerender = false;

// Schema for update request body
const UpdateFlashcardSchema = z.object({
    front: z.string().min(1).optional(),
    back: z.string().min(1).optional(),
    source: z.enum(["manual", "ai-full", "ai-edited"], {
        errorMap: () => ({
            message: "Source must be one of: manual, ai-full, ai-edited",
        }),
    }).optional(),
});

export const DELETE: APIRoute = async ({ params, locals }) => {
    const { id } = params;

    if (!id) {
        return new Response(
            JSON.stringify({ error: "Flashcard id is required" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    // Validate that id is a valid UUID using the uuidSchema
    try {
        uuidSchema.parse(id);
    } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid UUID format." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const supabase = locals.supabase;

    try {
        // Call the flashcard service to delete the flashcard
        await deleteFlashcard(supabase, id, DEFAULT_USER_ID);
        return new Response(null, { status: 204 });
    } catch (err: any) {
        console.error("Error deleting flashcard:", err);
        if (err.message === "Flashcard not found") {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response(
            JSON.stringify({
                error: "Internal Server Error",
                message: err.message ||
                    "An error occurred while deleting the flashcard",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
};

export const GET: APIRoute = async ({ params, locals }) => {
    try {
        // Check if id is provided
        const { id } = params;
        if (!id) {
            return new Response(
                JSON.stringify({ message: "Flashcard ID is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

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

        // Fetch the flashcard
        try {
            const flashcard = await getFlashcard(supabase, id, userId);
            return new Response(
                JSON.stringify(flashcard),
                { headers: { "Content-Type": "application/json" } },
            );
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === "Flashcard not found"
            ) {
                return new Response(
                    JSON.stringify({ message: "Flashcard not found" }),
                    {
                        status: 404,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }
            throw error;
        }
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

export const PATCH: APIRoute = async ({ request, params, locals }) => {
    try {
        // Check if id is provided
        const { id } = params;
        if (!id) {
            return new Response(
                JSON.stringify({ message: "Flashcard ID is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

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

        // Parse and validate request body
        let updateData;
        try {
            const body = await request.json();
            updateData = UpdateFlashcardSchema.parse(body);
        } catch (error) {
            return new Response(
                JSON.stringify({
                    message: "Invalid request body",
                    details: error instanceof Error ? error.message : undefined,
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Update the flashcard
        try {
            const updatedFlashcard = await updateFlashcard(
                supabase,
                id,
                updateData,
                userId,
            );
            return new Response(
                JSON.stringify(updatedFlashcard),
                { headers: { "Content-Type": "application/json" } },
            );
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === "Flashcard not found"
            ) {
                return new Response(
                    JSON.stringify({ message: "Flashcard not found" }),
                    {
                        status: 404,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }
            throw error;
        }
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
