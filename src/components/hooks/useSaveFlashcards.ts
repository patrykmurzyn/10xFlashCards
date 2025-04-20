import { useState } from "react";
import type { CreateFlashcardDTO, CreateFlashcardsCommand } from "@/types";

export function useSaveFlashcards() {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function save(command: CreateFlashcardsCommand) {
        setIsSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch("/api/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(command),
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to save flashcards");
            }
            setSuccess(true);
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
        } finally {
            setIsSaving(false);
        }
    }

    return { save, isSaving, error, success };
}
