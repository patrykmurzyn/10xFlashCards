import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardDTO } from "@/types";

interface EditFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: FlashcardDTO;
  onSave: (updatedFlashcard: { front: string; back: string }) => void;
}

const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  isOpen,
  onClose,
  flashcard,
  onSave,
}) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
    }
  }, [flashcard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (!front.trim() || !back.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ front, back });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="front">Front (Question)</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFront(e.target.value)
              }
              placeholder="Enter the question"
              required
              className="min-h-[100px]"
              aria-label="Flashcard front side"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="back">Back (Answer)</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBack(e.target.value)
              }
              placeholder="Enter the answer"
              required
              className="min-h-[100px]"
              aria-label="Flashcard back side"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardModal;
