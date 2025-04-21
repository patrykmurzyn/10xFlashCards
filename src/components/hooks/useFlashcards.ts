import { useEffect, useState } from "react";
import type { FlashcardDTO, UpdateFlashcardCommand } from "@/types";

interface UseFlashcardsResult {
    flashcards: FlashcardDTO[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    deleteFlashcard: (id: string) => Promise<void>;
    updateFlashcard: (
        id: string,
        data: UpdateFlashcardCommand,
    ) => Promise<void>;
    refetch: () => void;
}

export function useFlashcards(
    page: number = 1,
    limit: number = 10,
): UseFlashcardsResult {
    const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const refetch = () => {
        setRefetchTrigger((prev) => prev + 1);
    };

    // Fetch flashcards
    useEffect(() => {
        const fetchFlashcards = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/flashcards?page=${page}&limit=${limit}`,
                );
                if (!response.ok) {
                    throw new Error(
                        `Error fetching flashcards: ${response.statusText}`,
                    );
                }

                const data = await response.json();
                setFlashcards(data.data);
                setTotalCount(data.pagination.total);
            } catch (err) {
                console.error("Failed to fetch flashcards:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch flashcards",
                );
                setFlashcards([]);
                setTotalCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFlashcards();
    }, [page, limit, refetchTrigger]);

    // Delete a flashcard
    const deleteFlashcard = async (id: string): Promise<void> => {
        try {
            const response = await fetch(`/api/flashcards/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                        `Failed to delete flashcard: ${response.statusText}`,
                );
            }
        } catch (err) {
            console.error("Error deleting flashcard:", err);
            throw err;
        }
    };

    // Update a flashcard
    const updateFlashcard = async (
        id: string,
        data: UpdateFlashcardCommand,
    ): Promise<void> => {
        try {
            const response = await fetch(`/api/flashcards/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                        `Failed to update flashcard: ${response.statusText}`,
                );
            }
        } catch (err) {
            console.error("Error updating flashcard:", err);
            throw err;
        }
    };

    return {
        flashcards,
        totalCount,
        isLoading,
        error,
        deleteFlashcard,
        updateFlashcard,
        refetch,
    };
}
