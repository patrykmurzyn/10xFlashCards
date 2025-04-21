import React, { useState, useEffect } from "react";
import TextAreaWithCounter from "./TextAreaWithCounter";
import GenerateButton from "./GenerateButton";
import SkeletonLoader from "./SkeletonLoader";
import { useGenerateFlashcards } from "@/components/hooks/useGenerateFlashcards";
import { useSaveFlashcards } from "@/components/hooks/useSaveFlashcards";
import SaveSelectedButton from "./SaveSelectedButton";
import FlashcardSuggestionList from "./FlashcardSuggestionList";
import { Toaster, toast } from "sonner";
import type { FlashcardSuggestion } from "@/types";

const GenerateFlashcardsView: React.FC = () => {
  const [sourceText, setSourceText] = useState("");
  const {
    generate,
    suggestions: hookSuggestions,
    generationId,
    isLoading,
    error: apiError,
  } = useGenerateFlashcards();
  const {
    save,
    isSaving,
    error: saveError,
    success: saveSuccess,
    savedCount,
  } = useSaveFlashcards();
  const [localSuggestions, setLocalSuggestions] = useState<
    FlashcardSuggestion[]
  >([]);
  const minLength = 1000;
  const maxLength = 10000;
  const isValid =
    sourceText.length >= minLength && sourceText.length <= maxLength;
  const handleGenerate = () => {
    if (isValid) generate(sourceText);
  };
  const [statusMap, setStatusMap] = useState<
    Record<number, "pending" | "approved" | "edited" | "rejected">
  >({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedFront, setEditedFront] = useState("");
  const [editedBack, setEditedBack] = useState("");
  useEffect(() => {
    setLocalSuggestions(hookSuggestions);
    const map: Record<number, "pending" | "approved" | "edited" | "rejected"> =
      {};
    hookSuggestions.forEach((_, idx) => {
      map[idx] = "pending";
    });
    setStatusMap(map);
  }, [hookSuggestions]);
  useEffect(() => {
    if (apiError) toast.error(apiError);
  }, [apiError]);
  useEffect(() => {
    if (saveError) {
      toast.error(`Failed to save flashcards: ${saveError}`);
    } else if (saveSuccess && savedCount > 0) {
      toast.success(
        `Successfully saved ${savedCount} flashcard${
          savedCount === 1 ? "" : "s"
        }.`
      );
    }
  }, [saveError, saveSuccess, savedCount]);
  const handleSaveFlashcards = async () => {
    if (!generationId) {
      toast.error(
        "No generation ID available. Please generate flashcards first."
      );
      return;
    }

    const selectedFlashcards = localSuggestions
      .map((s, idx) => ({ suggestion: s, idx }))
      .filter(({ idx }) => ["approved", "edited"].includes(statusMap[idx]));

    if (selectedFlashcards.length === 0) {
      toast.error("Please approve or edit at least one flashcard to save.");
      return;
    }

    const flashcards = selectedFlashcards.map(({ suggestion: s }) => ({
      front: s.front,
      back: s.back,
      source: s.source,
      generation_id: generationId,
    }));

    const result = await save({ flashcards });

    // If some flashcards failed to save, show detailed feedback
    if (result?.failed?.length > 0 && result.data.length === 0) {
      toast.error(`Failed to save flashcards: ${result.failed[0].error}`);
    }
  };
  return (
    <div className="space-y-4 p-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-semibold">Generate Flashcards</h1>
      <TextAreaWithCounter
        value={sourceText}
        onChange={setSourceText}
        minLength={minLength}
        maxLength={maxLength}
      />
      <GenerateButton
        disabled={!isValid || isLoading}
        onClick={handleGenerate}
      />
      {isLoading && <SkeletonLoader count={4} />}
      {apiError && (
        <div role="alert" className="text-destructive">
          {apiError}
        </div>
      )}
      {/* Flashcard suggestions */}
      {!isLoading && localSuggestions.length > 0 && (
        <div>
          <FlashcardSuggestionList
            suggestions={localSuggestions}
            statusMap={statusMap}
            editingIndex={editingIndex}
            editedFront={editedFront}
            editedBack={editedBack}
            onApprove={(idx) =>
              setStatusMap({ ...statusMap, [idx]: "approved" })
            }
            onEditStart={(idx) => {
              setEditingIndex(idx);
              setEditedFront(localSuggestions[idx].front);
              setEditedBack(localSuggestions[idx].back);
            }}
            onEditChangeFront={setEditedFront}
            onEditChangeBack={setEditedBack}
            onEditSave={(idx) => {
              setStatusMap({ ...statusMap, [idx]: "edited" });
              setLocalSuggestions((prev) => {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  front: editedFront,
                  back: editedBack,
                };
                return updated;
              });
              setEditingIndex(null);
            }}
            onEditCancel={() => setEditingIndex(null)}
            onReject={(idx) =>
              setStatusMap({ ...statusMap, [idx]: "rejected" })
            }
            onUndoEdit={(idx) => {
              setLocalSuggestions((prev) => {
                const updated = [...prev];
                updated[idx] = hookSuggestions[idx];
                return updated;
              });
              setStatusMap({ ...statusMap, [idx]: "pending" });
            }}
          />
          {/* Save selected button and status */}
          <div className="pt-4">
            <SaveSelectedButton
              disabled={
                Object.values(statusMap).filter(
                  (st) => st === "approved" || st === "edited"
                ).length === 0 || isSaving
              }
              isLoading={isSaving}
              onClick={handleSaveFlashcards}
            />
            {saveError && (
              <div role="alert" className="text-destructive mt-2">
                {saveError}
              </div>
            )}
            {saveSuccess && savedCount > 0 && (
              <div role="status" className="text-green-600 mt-2">
                Successfully saved {savedCount} flashcard
                {savedCount === 1 ? "" : "s"}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateFlashcardsView;
