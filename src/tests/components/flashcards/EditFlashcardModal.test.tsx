import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditFlashcardModal from "@/components/flashcards/EditFlashcardModal";
import type { FlashcardDTO } from "@/types";

// Mock Dialog component since it uses portal rendering that might not be available in the test environment
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

describe("EditFlashcardModal", () => {
  const mockFlashcard: FlashcardDTO = {
    id: "1",
    front: "Original question",
    back: "Original answer",
    created_at: "2025-04-20T10:00:00Z",
    updated_at: "2025-04-20T10:00:00Z",
    source: "manual",
    generation_id: null,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    flashcard: mockFlashcard,
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when isOpen is true and doesn't render when false", () => {
    // Test with isOpen = true
    const { rerender, queryByTestId } = render(
      <EditFlashcardModal {...defaultProps} isOpen={true} />
    );

    expect(queryByTestId("dialog")).toBeInTheDocument();

    // Test with isOpen = false
    rerender(<EditFlashcardModal {...defaultProps} isOpen={false} />);

    expect(queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("initializes form with flashcard data", () => {
    render(<EditFlashcardModal {...defaultProps} />);

    const frontTextarea = screen.getByLabelText("Flashcard front side");
    const backTextarea = screen.getByLabelText("Flashcard back side");

    expect(frontTextarea).toHaveValue(mockFlashcard.front);
    expect(backTextarea).toHaveValue(mockFlashcard.back);
  });

  it("updates form state when inputs change", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardModal {...defaultProps} />);

    const frontTextarea = screen.getByLabelText("Flashcard front side");
    const backTextarea = screen.getByLabelText("Flashcard back side");

    await user.clear(frontTextarea);
    await user.type(frontTextarea, "New question");
    await user.clear(backTextarea);
    await user.type(backTextarea, "New answer");

    expect(frontTextarea).toHaveValue("New question");
    expect(backTextarea).toHaveValue("New answer");
  });

  it("calls onSave with updated values when form is submitted", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<EditFlashcardModal {...defaultProps} onSave={onSave} />);

    const frontTextarea = screen.getByLabelText("Flashcard front side");
    const backTextarea = screen.getByLabelText("Flashcard back side");

    await user.clear(frontTextarea);
    await user.type(frontTextarea, "New question");
    await user.clear(backTextarea);
    await user.type(backTextarea, "New answer");

    const saveButton = screen.getByText("Save Changes");
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith({
      front: "New question",
      back: "New answer",
    });
  });

  it("calls onClose when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardModal {...defaultProps} />);

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("disables buttons while submitting", async () => {
    const user = userEvent.setup();
    // Make onSave delay to simulate async operation
    const onSave = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

    render(<EditFlashcardModal {...defaultProps} onSave={onSave} />);

    const saveButton = screen.getByText("Save Changes");
    await user.click(saveButton);

    // During submission, the button should show "Saving..." and be disabled
    expect(saveButton).toHaveTextContent("Saving...");

    // Wait for the async save to complete
    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
