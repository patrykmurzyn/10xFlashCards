import React, { useState, useEffect } from "react";
import { useFlashcards } from "@/components/hooks/useFlashcards";
import FlashcardList from "./FlashcardList";
import PaginationControls from "./PaginationControls";
import EditFlashcardModal from "./EditFlashcardModal";
import ConfirmDialog from "../ui/ConfirmDialog";
import { Toaster, toast } from "sonner";
import type { FlashcardDTO } from "@/types";

const FlashcardsListView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const {
    flashcards,
    totalCount,
    isLoading,
    error,
    deleteFlashcard,
    updateFlashcard,
    refetch,
  } = useFlashcards(page, limit);

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDTO | null>(
    null
  );

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleEditClick = (flashcard: FlashcardDTO) => {
    setEditingFlashcard(flashcard);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (updatedFlashcard: {
    front: string;
    back: string;
  }) => {
    if (!editingFlashcard) return;

    try {
      await updateFlashcard(editingFlashcard.id, {
        front: updatedFlashcard.front,
        back: updatedFlashcard.back,
        source: editingFlashcard.source,
      });
      toast.success("Flashcard updated successfully");
      setIsEditModalOpen(false);
      refetch();
    } catch (err) {
      toast.error("Failed to update flashcard");
    }
  };

  const handleDeleteClick = (id: string) => {
    setFlashcardToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!flashcardToDelete) return;

    setIsDeleting(true);
    try {
      await deleteFlashcard(flashcardToDelete);
      toast.success("Flashcard deleted successfully");
      refetch();
    } catch (err) {
      toast.error("Failed to delete flashcard");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setFlashcardToDelete(null);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4 p-6">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">My Flashcards</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>You don't have any flashcards yet. Try generating some!</p>
        </div>
      ) : (
        <>
          <FlashcardList
            flashcards={flashcards}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />

          <div className="mt-4 flex justify-center">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {editingFlashcard && (
        <EditFlashcardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          flashcard={editingFlashcard}
          onSave={handleEditSave}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Flashcard"
        description="Are you sure you want to delete this flashcard? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isLoading={isDeleting}
        isDanger
      />
    </div>
  );
};

export default FlashcardsListView;
