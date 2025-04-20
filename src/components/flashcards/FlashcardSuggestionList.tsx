import React from "react";
import type { FlashcardSuggestion } from "@/types";
import FlashcardSuggestionItem from "./FlashcardSuggestionItem";

interface FlashcardSuggestionListProps {
  suggestions: FlashcardSuggestion[];
  statusMap: Record<number, "pending" | "approved" | "edited" | "rejected">;
  editingIndex: number | null;
  editedFront: string;
  editedBack: string;
  onApprove: (idx: number) => void;
  onEditStart: (idx: number) => void;
  onEditChangeFront: (value: string) => void;
  onEditChangeBack: (value: string) => void;
  onEditSave: (idx: number) => void;
  onEditCancel: () => void;
  onReject: (idx: number) => void;
  onUndoEdit: (idx: number) => void;
}

const FlashcardSuggestionList: React.FC<FlashcardSuggestionListProps> = ({
  suggestions,
  statusMap,
  editingIndex,
  editedFront,
  editedBack,
  onApprove,
  onEditStart,
  onEditChangeFront,
  onEditChangeBack,
  onEditSave,
  onEditCancel,
  onReject,
  onUndoEdit,
}) => {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {suggestions.map((s, idx) => (
        <FlashcardSuggestionItem
          key={idx}
          suggestion={s}
          status={statusMap[idx]}
          isEditing={editingIndex === idx}
          editedFront={editedFront}
          editedBack={editedBack}
          onApprove={() => onApprove(idx)}
          onEditStart={() => onEditStart(idx)}
          onEditChangeFront={onEditChangeFront}
          onEditChangeBack={onEditChangeBack}
          onEditSave={() => onEditSave(idx)}
          onEditCancel={onEditCancel}
          onReject={() => onReject(idx)}
          onUndoEdit={() => onUndoEdit(idx)}
        />
      ))}
    </ul>
  );
};

export default FlashcardSuggestionList;
