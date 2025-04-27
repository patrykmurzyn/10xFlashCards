import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GenerateFlashcardsView from "@/components/flashcards/GenerateFlashcardsView";
import * as useGenerateFlashcardsModule from "@/components/hooks/useGenerateFlashcards";
import * as useSaveFlashcardsModule from "@/components/hooks/useSaveFlashcards";

// Mock the generate flashcards hook
vi.mock("@/components/hooks/useGenerateFlashcards", () => ({
  useGenerateFlashcards: vi.fn(),
}));

// Mock the save flashcards hook
vi.mock("@/components/hooks/useSaveFlashcards", () => ({
  useSaveFlashcards: vi.fn(() => ({
    save: vi.fn(),
    isSaving: false,
    error: null,
    success: false,
    savedCount: 0,
  })),
}));

// Mock other dependencies to simplify rendering
vi.mock("@/components/flashcards/TextAreaWithCounter", () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="text-area"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
vi.mock("@/components/flashcards/GenerateButton", () => ({
  default: ({ onClick, disabled }: any) => (
    <button data-testid="generate-button" onClick={onClick} disabled={disabled}>
      Generate
    </button>
  ),
}));
vi.mock("@/components/flashcards/FlashcardSuggestionList", () => ({
  default: ({ suggestions, onApprove, onReject }: any) => (
    <div data-testid="flashcard-list">
      {suggestions.map((_: any, idx: number) => (
        <div key={idx} data-testid={`flashcard-${idx}`}>
          <button data-testid={`approve-${idx}`} onClick={() => onApprove(idx)}>
            Approve
          </button>
          <button data-testid={`reject-${idx}`} onClick={() => onReject(idx)}>
            Reject
          </button>
        </div>
      ))}
    </div>
  ),
}));
vi.mock("@/components/flashcards/SaveSelectedButton", () => ({
  default: ({ onClick, disabled, isLoading }: any) => (
    <button data-testid="save-button" onClick={onClick} disabled={disabled}>
      {isLoading ? "Saving..." : "Save"}
    </button>
  ),
}));

describe("GenerateFlashcardsView", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default stub for save flashcards hook to prevent undefined
    (useSaveFlashcardsModule.useSaveFlashcards as any).mockReturnValue({
      save: vi.fn(),
      isSaving: false,
      error: null,
      success: false,
      savedCount: 0,
    });
  });

  it("calls generate with correct parameters when generate button is clicked", async () => {
    const generateMock = vi.fn();
    (useGenerateFlashcardsModule.useGenerateFlashcards as any).mockReturnValue({
      generate: generateMock,
      suggestions: [],
      generationId: null,
      model: null,
      isLoading: false,
      error: null,
    });

    render(<GenerateFlashcardsView />);

    const validText = "a".repeat(1000);
    await user.type(screen.getByTestId("text-area"), validText);
    await user.click(screen.getByTestId("generate-button"));

    expect(generateMock).toHaveBeenCalledWith(validText, 10);
  });

  it("renders the correct number of suggestions", () => {
    const mockSuggestions = Array.from({ length: 3 }, (_, idx) => ({
      front: `Q${idx + 1}`,
      back: `A${idx + 1}`,
      source: "ai-full",
    }));
    (useGenerateFlashcardsModule.useGenerateFlashcards as any).mockReturnValue({
      generate: vi.fn(),
      suggestions: mockSuggestions,
      generationId: null,
      model: null,
      isLoading: false,
      error: null,
    });

    render(<GenerateFlashcardsView />);

    const suggestionItems = screen.getAllByTestId(/flashcard-\d+/);
    expect(suggestionItems).toHaveLength(mockSuggestions.length);
  });

  it("enables save button after approving flashcards and calls save with selected items", async () => {
    const mockSuggestions = [
      { front: "Q1", back: "A1", source: "ai-full" },
      { front: "Q2", back: "A2", source: "ai-full" },
    ];
    // Stub generation hook
    (useGenerateFlashcardsModule.useGenerateFlashcards as any).mockReturnValue({
      generate: vi.fn(),
      suggestions: mockSuggestions,
      generationId: "gen-id",
      model: null,
      isLoading: false,
      error: null,
    });
    // Stub save hook
    const saveMock = vi.fn();
    (useSaveFlashcardsModule.useSaveFlashcards as any).mockReturnValue({
      save: saveMock,
      isSaving: false,
      error: null,
      success: false,
      savedCount: 0,
    });
    render(<GenerateFlashcardsView />);
    // Approve both flashcards
    await user.click(screen.getByTestId("approve-0"));
    await user.click(screen.getByTestId("approve-1"));
    const saveButton = screen.getByTestId("save-button");
    expect(saveButton).not.toBeDisabled();
    await user.click(saveButton);
    expect(saveMock).toHaveBeenCalledWith({
      flashcards: [
        { front: "Q1", back: "A1", source: "ai-full", generation_id: "gen-id" },
        { front: "Q2", back: "A2", source: "ai-full", generation_id: "gen-id" },
      ],
    });
  });

  it("keeps save button disabled when flashcards are rejected", async () => {
    const mockSuggestions = [{ front: "Q1", back: "A1", source: "ai-full" }];
    (useGenerateFlashcardsModule.useGenerateFlashcards as any).mockReturnValue({
      generate: vi.fn(),
      suggestions: mockSuggestions,
      generationId: "gen-id",
      model: null,
      isLoading: false,
      error: null,
    });
    render(<GenerateFlashcardsView />);
    await user.click(screen.getByTestId("reject-0"));
    const saveButton = screen.getByTestId("save-button");
    expect(saveButton).toBeDisabled();
  });
});
