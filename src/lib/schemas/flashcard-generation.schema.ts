import { z } from "zod";

// Validation schema for generate flashcards request
export const generateFlashcardsSchema = z.object({
    source_text: z
        .string()
        .min(1000, "Text must be at least 1000 characters long")
        .max(10000, "Text must not exceed 10000 characters"),
});

// Type inference from the schema
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

// Error codes for generation process
export enum GenerationErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    EMPTY_RESULTS = "EMPTY_RESULTS",
}
