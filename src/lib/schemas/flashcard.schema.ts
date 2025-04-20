import { z } from "zod";
import { uuidSchema } from "./uuid.schema";

// Schema for validating a single flashcard creation
export const createFlashcardSchema = z.object({
    front: z
        .string()
        .min(1, "Front text is required")
        .max(200, "Front text must not exceed 200 characters"),
    back: z
        .string()
        .min(1, "Back text is required")
        .max(500, "Back text must not exceed 500 characters"),
    source: z.enum(["manual", "AI-full", "AI-edited"], {
        errorMap: () => ({
            message: "Source must be one of: manual, AI-full, AI-edited",
        }),
    }),
    generation_id: z.union([uuidSchema, z.null()]),
}).refine(
    (data) => {
        // For manual source, generation_id must be null
        if (data.source === "manual") {
            return data.generation_id === null;
        }

        // For AI sources, generation_id must be a valid UUID
        return data.generation_id !== null;
    },
    {
        message:
            "For 'manual' source, generation_id must be null; for AI sources, generation_id is required",
        path: ["generation_id"],
    },
);

// Schema for validating the create flashcards command
export const createFlashcardsCommandSchema = z.object({
    flashcards: z.array(createFlashcardSchema).min(
        1,
        "At least one flashcard is required",
    ),
});

// Schema for validating flashcard updates
export const updateFlashcardSchema = z.object({
    front: z
        .string()
        .min(1, "Front text is required")
        .max(200, "Front text must not exceed 200 characters"),
    back: z
        .string()
        .min(1, "Back text is required")
        .max(500, "Back text must not exceed 500 characters"),
    source: z.enum(["manual", "AI-edited"], {
        errorMap: () => ({
            message: "Source must be one of: manual, AI-edited",
        }),
    }),
});

// Type inference from the schemas
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type CreateFlashcardsCommandInput = z.infer<
    typeof createFlashcardsCommandSchema
>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
