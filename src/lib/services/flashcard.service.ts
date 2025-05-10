import type { SupabaseClient } from "../../db/supabase.client";
import type {
    CreateFlashcardDTO,
    FlashcardDTO,
    FlashcardInsert,
    UpdateFlashcardCommand,
} from "../../types";

/**
 * Deletes a flashcard with the specified id if it belongs to the given user.
 * Throws an error if the deletion fails or the flashcard is not found.
 *
 * @param supabase - The Supabase client instance from context.locals.
 * @param id - The flashcard ID to delete.
 * @param userId - The user id owning the flashcard.
 */
export async function deleteFlashcard(
    supabase: SupabaseClient,
    id: string,
    userId: string,
): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required to delete a flashcard");
    }

    // First check if the flashcard exists for this user
    const checkResult = await supabase
        .from("flashcards")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (checkResult.error) {
        throw new Error(`Database error: ${checkResult.error.message}`);
    }

    if (!checkResult.data) {
        throw new Error("Flashcard not found");
    }

    // Now that we know the flashcard exists, delete it
    const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        throw new Error(`Error deleting flashcard: ${error.message}`);
    }
}

/**
 * Retrieves a flashcard with the specified id if it belongs to the given user.
 * Returns the flashcard as a FlashcardDTO (without user_id).
 * Throws an error if the flashcard is not found or if there's a database error.
 *
 * @param supabase - The Supabase client instance from context.locals.
 * @param id - The flashcard ID to retrieve.
 * @param userId - The user id owning the flashcard.
 * @returns The flashcard as a FlashcardDTO.
 */
export async function getFlashcard(
    supabase: SupabaseClient,
    id: string,
    userId: string,
): Promise<FlashcardDTO> {
    if (!userId) {
        throw new Error("User ID is required to retrieve a flashcard");
    }

    const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
        throw new Error("Flashcard not found");
    }

    // Transform to FlashcardDTO by omitting the user_id field
    const { user_id, ...flashcardDTO } = data;
    return flashcardDTO;
}

/**
 * Result interface for flashcard creation operation.
 */
export interface CreateFlashcardsResult {
    data: FlashcardDTO[];
    failed: Array<{
        index: number;
        error: string;
    }>;
}

/**
 * Creates multiple flashcards for a user.
 * Returns an object with successful creations and any failures.
 *
 * @param supabase - The Supabase client instance from context.locals.
 * @param flashcards - Array of flashcard data to create.
 * @param userId - The user id who owns the flashcards.
 * @returns Object containing successful creations and failures.
 */
export async function createFlashcards(
    supabase: SupabaseClient,
    flashcards: CreateFlashcardDTO[],
    userId: string,
): Promise<CreateFlashcardsResult> {
    // Validate userId
    if (!userId) {
        throw new Error("User ID is required to create flashcards");
    }

    const result: CreateFlashcardsResult = {
        data: [],
        failed: [],
    };

    // Create an array to hold successful inserts
    const flashcardsToInsert: FlashcardInsert[] = [];

    // Prepare the flashcards with user_id for insertion
    for (const [index, flashcard] of flashcards.entries()) {
        try {
            // Add user_id to create a valid FlashcardInsert
            const flashcardToInsert: FlashcardInsert = {
                ...flashcard,
                user_id: userId,
            };

            flashcardsToInsert.push(flashcardToInsert);
        } catch (error: any) {
            // If there's an error preparing the flashcard, add it to failures
            result.failed.push({
                index,
                error: error.message ||
                    "Failed to prepare flashcard for insertion",
            });
        }
    }

    // If there are flashcards to insert, proceed with bulk insertion
    if (flashcardsToInsert.length > 0) {
        const { data, error } = await supabase
            .from("flashcards")
            .insert(flashcardsToInsert)
            .select();

        if (error) {
            // If bulk insert fails, mark all as failed
            for (let i = 0; i < flashcardsToInsert.length; i++) {
                result.failed.push({
                    index: i, // This is an approximation as we lost the original indices
                    error: `Database error: ${error.message}`,
                });
            }
        } else if (data) {
            // Add successful insertions to the result
            for (const item of data) {
                // Transform to FlashcardDTO by omitting user_id
                const { user_id, ...flashcardDTO } = item;
                result.data.push(flashcardDTO);
            }
        }
    }

    return result;
}

/**
 * Updates a flashcard with the specified id if it belongs to the given user.
 * Returns the updated flashcard as a FlashcardDTO (without user_id).
 * Throws an error if the flashcard is not found, if there's a database error,
 * or if the update fails.
 *
 * @param supabase - The Supabase client instance from context.locals.
 * @param id - The flashcard ID to update.
 * @param updateData - The data to update on the flashcard.
 * @param userId - The user id owning the flashcard.
 * @returns The updated flashcard as a FlashcardDTO.
 */
export async function updateFlashcard(
    supabase: SupabaseClient,
    id: string,
    updateData: UpdateFlashcardCommand,
    userId: string,
): Promise<FlashcardDTO> {
    if (!userId) {
        throw new Error("User ID is required to update a flashcard");
    }

    // First check if the flashcard exists for this user
    const checkResult = await supabase
        .from("flashcards")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (checkResult.error) {
        throw new Error(`Database error: ${checkResult.error.message}`);
    }

    if (!checkResult.data) {
        throw new Error("Flashcard not found");
    }

    // Update the flashcard
    const { data, error } = await supabase
        .from("flashcards")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(`Error updating flashcard: ${error.message}`);
    }

    if (!data) {
        throw new Error("Failed to retrieve the updated flashcard");
    }

    // Transform to FlashcardDTO by omitting the user_id field
    const { user_id, ...flashcardDTO } = data;
    return flashcardDTO;
}

/**
 * Helper function to get current user ID or throw an error
 */
export async function getCurrentUserId(
    supabase: SupabaseClient,
): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        throw new Error(`Authentication error: ${error.message}`);
    }

    if (!user || !user.id) {
        throw new Error("No authenticated user found");
    }

    return user.id;
}
