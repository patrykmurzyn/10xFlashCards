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

export const prerender = false;

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
    // Extract the Supabase client from locals
    const supabase = locals.supabase;

    // Extract the ID parameter from the URL
    const { id } = params;

    // Check if ID exists
    if (!id) {
        return new Response(
            JSON.stringify({ error: "Flashcard ID is required" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    // Validate the ID parameter
    const parseResult = uuidSchema.safeParse(id);
    if (!parseResult.success) {
        return new Response(
            JSON.stringify({
                error: "Invalid ID format",
                details: parseResult.error.flatten(),
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    try {
        // Call the flashcard service to retrieve the flashcard
        const flashcardDTO = await getFlashcard(supabase, id);

        return new Response(JSON.stringify(flashcardDTO), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error retrieving flashcard:", error);

        if (error.message === "Flashcard not found") {
            return new Response(
                JSON.stringify({ error: error.message }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

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

export const PUT: APIRoute = async ({ params, request, locals }) => {
    // Extract the Supabase client from locals
    const supabase = locals.supabase;

    // Extract the ID parameter from the URL
    const { id } = params;

    // Check if ID exists
    if (!id) {
        return new Response(
            JSON.stringify({ error: "Flashcard ID is required" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    // Validate the ID parameter
    const idParseResult = uuidSchema.safeParse(id);
    if (!idParseResult.success) {
        return new Response(
            JSON.stringify({
                error: "Invalid ID format",
                details: idParseResult.error.flatten(),
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }

    try {
        // Parse and validate request body
        const requestData = await request.json();
        const validationResult = updateFlashcardSchema.safeParse(requestData);

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
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Call the service to update the flashcard
        const updatedFlashcard = await updateFlashcard(
            supabase,
            id,
            validationResult.data,
        );

        // Return the updated flashcard
        return new Response(JSON.stringify(updatedFlashcard), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error updating flashcard:", error);

        if (error.message === "Flashcard not found") {
            return new Response(
                JSON.stringify({ error: error.message }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

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
