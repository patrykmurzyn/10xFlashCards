import { useState } from "react";
import type {
    FlashcardSuggestion,
    GeneratedFlashcardsDTO,
    GenerateFlashcardsCommand,
} from "@/types";

export function useGenerateFlashcards() {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<FlashcardSuggestion[]>([]);
    const [generationId, setGenerationId] = useState<string | null>(null);
    const [model, setModel] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function generate(sourceText: string) {
        setIsLoading(true);
        setError(null);
        try {
            const payload: GenerateFlashcardsCommand = {
                source_text: sourceText,
            };
            const res = await fetch("/api/flashcards/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to generate suggestions");
            }
            const data: GeneratedFlashcardsDTO = await res.json();
            setGenerationId(data.generation_id);
            setModel(data.model);
            setSuggestions(data.suggestions);
        } catch (err: any) {
            setError(err.message ?? "Unknown error");
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }

    return { generate, suggestions, generationId, model, isLoading, error };
}
