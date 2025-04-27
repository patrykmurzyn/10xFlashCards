import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditFlashcardForm from "@/components/flashcards/EditFlashcardForm";

describe("EditFlashcardForm", () => {
  const defaultProps = {
    front: "Original question",
    back: "Original answer",
    onChangeFront: vi.fn(),
    onChangeBack: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial values", () => {
    render(<EditFlashcardForm {...defaultProps} />);

    const frontInput = screen.getByLabelText("Edit front text");
    const backInput = screen.getByLabelText("Edit back text");

    expect(frontInput).toHaveValue(defaultProps.front);
    expect(backInput).toHaveValue(defaultProps.back);
  });

  it("calls change handlers when inputs change", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardForm {...defaultProps} />);

    const frontInput = screen.getByLabelText("Edit front text");
    const backInput = screen.getByLabelText("Edit back text");

    // Simulate input changes - dispatching a change event with a mock target value
    fireEvent.change(frontInput, { target: { value: "New question" } });
    fireEvent.change(backInput, { target: { value: "New answer" } });

    expect(defaultProps.onChangeFront).toHaveBeenCalledWith("New question");
    expect(defaultProps.onChangeBack).toHaveBeenCalledWith("New answer");
  });

  it("calls onSave when save button is clicked", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardForm {...defaultProps} />);

    const saveButton = screen.getByLabelText("Save edited flashcard");
    await user.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardForm {...defaultProps} />);

    const cancelButton = screen.getByLabelText("Cancel editing");
    await user.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard shortcuts", async () => {
    const user = userEvent.setup();
    render(<EditFlashcardForm {...defaultProps} />);

    const frontInput = screen.getByLabelText("Edit front text");
    const backInput = screen.getByLabelText("Edit back text");

    // Enter in front field should save
    await user.click(frontInput);
    await user.keyboard("{Enter}");
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);

    // Ctrl+Enter in back field should save
    vi.clearAllMocks();
    await user.click(backInput);
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);

    // Escape in both fields should cancel
    vi.clearAllMocks();
    await user.click(frontInput);
    await user.keyboard("{Escape}");
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    await user.click(backInput);
    await user.keyboard("{Escape}");
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
