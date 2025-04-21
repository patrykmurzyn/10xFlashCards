import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardDTO } from "@/types";

interface FlashcardListProps {
  flashcards: FlashcardDTO[];
  onEditClick: (flashcard: FlashcardDTO) => void;
  onDeleteClick: (id: string) => void;
}

const FlashcardList: React.FC<FlashcardListProps> = ({
  flashcards,
  onEditClick,
  onDeleteClick,
}) => {
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Front</TableHead>
            <TableHead className="w-[40%]">Back</TableHead>
            <TableHead className="w-[10%]">Created</TableHead>
            <TableHead className="text-right w-[10%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flashcards.map((flashcard) => (
            <TableRow key={flashcard.id}>
              <TableCell className="font-medium">{flashcard.front}</TableCell>
              <TableCell>{flashcard.back}</TableCell>
              <TableCell>{formatDate(flashcard.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditClick(flashcard)}
                    aria-label={`Edit flashcard: ${flashcard.front}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteClick(flashcard.id)}
                    aria-label={`Delete flashcard: ${flashcard.front}`}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FlashcardList;
