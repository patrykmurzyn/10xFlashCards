import React from "react";
import type { FlashcardSuggestion } from "@/types";
import EditFlashcardForm from "./EditFlashcardForm";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FlashcardSuggestionItemProps {
  suggestion: FlashcardSuggestion;
  status: "pending" | "approved" | "edited" | "rejected";
  isEditing: boolean;
  editedFront: string;
  editedBack: string;
  onApprove: () => void;
  onEditStart: () => void;
  onEditChangeFront: (value: string) => void;
  onEditChangeBack: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onReject: () => void;
  onUndoEdit: () => void;
}

const FlashcardSuggestionItem: React.FC<FlashcardSuggestionItemProps> = ({
  suggestion,
  status,
  isEditing,
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
  // Avoid undefined status
  const safeStatus = status ?? "pending";
  if (isEditing) {
    return (
      <Card className="border-gray-500 bg-gray-700 text-gray-100">
        <CardContent>
          <EditFlashcardForm
            front={editedFront}
            back={editedBack}
            onChangeFront={onEditChangeFront}
            onChangeBack={onEditChangeBack}
            onSave={onEditSave}
            onCancel={onEditCancel}
          />
        </CardContent>
      </Card>
    );
  }

  // Determine card styles based on status
  let statusClasses = "border-gray-600 bg-gray-800 text-gray-100";
  let badgeClasses = "bg-gray-600 text-gray-100";
  if (safeStatus === "approved") {
    statusClasses = "border-green-500 bg-gray-800 text-gray-100";
    badgeClasses = "bg-green-600 text-green-100";
  } else if (safeStatus === "edited") {
    statusClasses = "border-blue-500 bg-gray-800 text-gray-100";
    badgeClasses = "bg-blue-600 text-blue-100";
  } else if (safeStatus === "rejected") {
    statusClasses = "border-red-500 bg-gray-800 text-gray-100";
    badgeClasses = "bg-red-600 text-red-100";
  }

  return (
    <Card className={statusClasses}>
      <CardHeader>
        <CardTitle>{suggestion.front}</CardTitle>
        {safeStatus !== "pending" && (
          <CardAction>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${badgeClasses}`}
            >
              {safeStatus.toUpperCase()}
            </span>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>{suggestion.back}</CardContent>
      <CardFooter className="space-x-2">
        {safeStatus === "edited" ? (
          <Button
            variant="outline"
            size="sm"
            className="border-blue-400 text-blue-400 hover:bg-blue-500 hover:text-gray-100 focus:ring-blue-500"
            aria-label="Undo edit"
            onClick={onUndoEdit}
          >
            Undo Edit
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="border-green-400 text-green-400 hover:bg-green-500 hover:text-gray-100 focus:ring-green-500"
              aria-label="Approve suggestion"
              onClick={onApprove}
              disabled={safeStatus === "approved" || safeStatus === "rejected"}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-500 text-gray-300 hover:bg-gray-600 hover:text-gray-100 focus:ring-gray-400"
              aria-label="Edit suggestion"
              onClick={onEditStart}
              disabled={safeStatus === "approved" || safeStatus === "rejected"}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-400 text-red-400 hover:bg-red-500 hover:text-gray-100 focus:ring-red-500"
              aria-label="Reject suggestion"
              onClick={onReject}
              disabled={safeStatus === "approved" || safeStatus === "rejected"}
            >
              Reject
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default FlashcardSuggestionItem;
