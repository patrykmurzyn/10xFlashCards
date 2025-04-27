import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FlashcardList from "@/components/flashcards/FlashcardList";
import type { FlashcardDTO } from "@/types";

describe("FlashcardList", () => {
  const mockFlashcards: FlashcardDTO[] = [
    {
      id: "1",
      front: "What is React?",
      back: "A JavaScript library for building user interfaces.",
      created_at: "2025-04-20T10:00:00Z",
      updated_at: "2025-04-20T10:00:00Z",
      source: "manual",
      generation_id: null,
    },
    {
      id: "2",
      front: "What is TypeScript?",
      back: "A strongly typed programming language that builds on JavaScript.",
      created_at: "2025-04-21T10:00:00Z",
      updated_at: "2025-04-21T10:00:00Z",
      source: "ai-full",
      generation_id: "gen-123",
    },
  ];

  it("renders flashcard data correctly", () => {
    const onEditClick = vi.fn();
    const onDeleteClick = vi.fn();

    render(
      <FlashcardList
        flashcards={mockFlashcards}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />
    );

    // Check if headers are rendered
    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Check if the flashcard data is rendered
    expect(screen.getByText("What is React?")).toBeInTheDocument();
    expect(
      screen.getByText("A JavaScript library for building user interfaces.")
    ).toBeInTheDocument();
    expect(screen.getByText("Apr 20, 2025")).toBeInTheDocument();

    expect(screen.getByText("What is TypeScript?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A strongly typed programming language that builds on JavaScript."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Apr 21, 2025")).toBeInTheDocument();
  });

  it("calls onEditClick when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEditClick = vi.fn();
    const onDeleteClick = vi.fn();

    render(
      <FlashcardList
        flashcards={mockFlashcards}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />
    );

    // Find all edit buttons by their aria-label
    const editButtons = screen.getAllByLabelText(/Edit flashcard:/);
    expect(editButtons).toHaveLength(mockFlashcards.length);

    // Click the first edit button
    await user.click(editButtons[0]);
    expect(onEditClick).toHaveBeenCalledWith(mockFlashcards[0]);

    // Click the second edit button
    await user.click(editButtons[1]);
    expect(onEditClick).toHaveBeenCalledWith(mockFlashcards[1]);
  });

  it("calls onDeleteClick when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onEditClick = vi.fn();
    const onDeleteClick = vi.fn();

    render(
      <FlashcardList
        flashcards={mockFlashcards}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />
    );

    // Find all delete buttons by their aria-label
    const deleteButtons = screen.getAllByLabelText(/Delete flashcard:/);
    expect(deleteButtons).toHaveLength(mockFlashcards.length);

    // Click the first delete button
    await user.click(deleteButtons[0]);
    expect(onDeleteClick).toHaveBeenCalledWith(mockFlashcards[0].id);

    // Click the second delete button
    await user.click(deleteButtons[1]);
    expect(onDeleteClick).toHaveBeenCalledWith(mockFlashcards[1].id);
  });

  it("renders empty table when no flashcards are provided", () => {
    const onEditClick = vi.fn();
    const onDeleteClick = vi.fn();

    render(
      <FlashcardList
        flashcards={[]}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
      />
    );

    // Headers should still be visible
    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // But no flashcard data
    expect(screen.queryByText("What is React?")).not.toBeInTheDocument();
  });
});
