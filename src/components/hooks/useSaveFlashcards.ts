import { useState } from "react";
import type {
    CreateFlashcardDTO,
    CreateFlashcardsCommand,
    FlashcardDTO,
} from "@/types";

interface SaveResult {
    success: boolean;
    data: FlashcardDTO[];
    failed: Array<{ index: number; error: string }>;
}

export function useSaveFlashcards() {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [savedCount, setSavedCount] = useState(0);

    async function save(command: CreateFlashcardsCommand) {
        setIsSaving(true);
        setError(null);
        setSuccess(false);
        setSavedCount(0);

        try {
            const res = await fetch("/api/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(command),
            });

            const data = await res.json();

            if (!res.ok) {
                let errorMessage = data.error || "Failed to save flashcards";

                // If there's specific error details, format them
                if (data.details?.failed?.length > 0) {
                    errorMessage = `${errorMessage}: ${
                        data.details.failed[0].error
                    }`;
                }

                throw new Error(errorMessage);
            }

            // Check if we got successful saves
            if (data.data && data.data.length > 0) {
                setSuccess(true);
                setSavedCount(data.data.length);
                return {
                    success: true,
                    data: data.data,
                    failed: data.failed || [],
                } as SaveResult;
            } else {
                // No cards were saved successfully
                const failMessage = data.failed && data.failed.length > 0
                    ? data.failed[0].error
                    : "No flashcards were saved";

                throw new Error(failMessage);
            }
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
            return {
                success: false,
                data: [],
                failed: [{
                    index: 0,
                    error: err.message ?? "Unknown error",
                }],
            } as SaveResult;
        } finally {
            setIsSaving(false);
        }
    }

    return { save, isSaving, error, success, savedCount };
}
