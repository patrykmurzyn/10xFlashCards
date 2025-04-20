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
    if (saveError) toast.error(saveError);
    else if (saveSuccess) toast.success("Flashcards saved successfully.");
  }, [saveError, saveSuccess]);
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
                ).length === 0
              }
              isLoading={isSaving}
              onClick={() => {
                if (!generationId) return;
                const flashcards = localSuggestions
                  .map((s, idx) => ({ suggestion: s, idx }))
                  .filter(({ idx }) =>
                    ["approved", "edited"].includes(statusMap[idx])
                  )
                  .map(({ suggestion: s }) => ({
                    front: s.front,
                    back: s.back,
                    source: s.source,
                    generation_id: generationId,
                  }));
                save({ flashcards });
              }}
            />
            {saveError && (
              <div role="alert" className="text-destructive mt-2">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div role="status" className="text-green-600 mt-2">
                Flashcards saved successfully.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateFlashcardsView;
