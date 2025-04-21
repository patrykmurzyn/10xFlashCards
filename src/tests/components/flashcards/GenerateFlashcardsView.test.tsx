import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import GenerateFlashcardsView from "@/components/flashcards/GenerateFlashcardsView";
import type { FlashcardSuggestion } from "@/types";

// Mock the hooks and child components
vi.mock("@/components/hooks/useGenerateFlashcards", () => ({
  useGenerateFlashcards: vi.fn(() => ({
    generate: vi.fn(),
    suggestions: [],
    generationId: null,
    model: null,
    isLoading: false,
    error: null,
  })),
}));

vi.mock("@/components/hooks/useSaveFlashcards", () => ({
  useSaveFlashcards: vi.fn(() => ({
    save: vi.fn(),
    isSaving: false,
    error: null,
    success: false,
  })),
}));

vi.mock("sonner", () => ({
  Toaster: vi.fn(() => null),
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/components/flashcards/TextAreaWithCounter", () => ({
  default: vi.fn(({ value, onChange }) => (
    <textarea
      data-testid="text-area"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )),
}));

vi.mock("@/components/flashcards/GenerateButton", () => ({
  default: vi.fn(({ onClick, disabled }) => (
    <button data-testid="generate-button" onClick={onClick} disabled={disabled}>
      Generate
    </button>
  )),
}));

vi.mock("@/components/flashcards/SkeletonLoader", () => ({
  default: vi.fn(() => <div data-testid="skeleton-loader">Loading...</div>),
}));

vi.mock("@/components/flashcards/SaveSelectedButton", () => ({
  default: vi.fn(({ onClick, disabled, isLoading }) => (
    <button
      data-testid="save-button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={isLoading}
    >
      Save
    </button>
  )),
}));

vi.mock("@/components/flashcards/FlashcardSuggestionList", () => ({
  default: vi.fn(
    ({
      suggestions,
      onApprove,
      onReject,
      onEditStart,
      onEditSave,
      onEditCancel,
    }) => (
      <div data-testid="flashcard-list">
        {suggestions.map((suggestion: FlashcardSuggestion, idx: number) => (
          <div key={idx} data-testid={`flashcard-${idx}`}>
            <div data-testid={`front-${idx}`}>{suggestion.front}</div>
            <div data-testid={`back-${idx}`}>{suggestion.back}</div>
            <button
              data-testid={`approve-${idx}`}
              onClick={() => onApprove(idx)}
            >
              Approve
            </button>
            <button data-testid={`reject-${idx}`} onClick={() => onReject(idx)}>
              Reject
            </button>
            <button
              data-testid={`edit-${idx}`}
              onClick={() => onEditStart(idx)}
            >
              Edit
            </button>
            <button
              data-testid={`save-edit-${idx}`}
              onClick={() => onEditSave(idx)}
            >
              Save Edit
            </button>
            <button
              data-testid={`cancel-edit-${idx}`}
              onClick={() => onEditCancel()}
            >
              Cancel Edit
            </button>
          </div>
        ))}
      </div>
    )
  ),
}));

// Import the actual modules to modify their mocked implementation in tests
import * as useGenerateFlashcardsModule from "@/components/hooks/useGenerateFlashcards";
import * as useSaveFlashcardsModule from "@/components/hooks/useSaveFlashcards";
import { toast } from "sonner";

describe("GenerateFlashcardsView", () => {
  const user = userEvent.setup();

  const mockSuggestions: FlashcardSuggestion[] = [
    { front: "Question 1", back: "Answer 1", source: "AI-full" },
    { front: "Question 2", back: "Answer 2", source: "AI-full" },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders with initial empty state", () => {
    render(<GenerateFlashcardsView />);

    expect(screen.getByText("Generate Flashcards")).toBeInTheDocument();
    expect(screen.getByTestId("text-area")).toBeInTheDocument();
    expect(screen.getByTestId("generate-button")).toBeInTheDocument();
    expect(screen.getByTestId("generate-button")).toBeDisabled();
  });

  it("enables generate button when text meets minimum length", async () => {
    render(<GenerateFlashcardsView />);

    // Create a string with exactly 1000 characters
    const validText = "a".repeat(1000);

    await user.type(screen.getByTestId("text-area"), validText);

    expect(screen.getByTestId("generate-button")).not.toBeDisabled();
  });

  it("disables generate button when text is too long", async () => {
    render(<GenerateFlashcardsView />);

    // Create a string with more than 10000 characters
    const tooLongText = "a".repeat(10001);

    await user.type(screen.getByTestId("text-area"), tooLongText);

    expect(screen.getByTestId("generate-button")).toBeDisabled();
  });

  it("calls generate function when button is clicked", async () => {
    // Override the mock implementation for this test
    const generateMock = vi.fn();
    vi.spyOn(
      useGenerateFlashcardsModule,
      "useGenerateFlashcards"
    ).mockImplementation(() => ({
      generate: generateMock,
      suggestions: [],
      generationId: null,
      model: null,
      isLoading: false,
      error: null,
    }));

    render(<GenerateFlashcardsView />);

    // Create a string with exactly 1000 characters
    const validText = "a".repeat(1000);

    await user.type(screen.getByTestId("text-area"), validText);
    await user.click(screen.getByTestId("generate-button"));

    expect(generateMock).toHaveBeenCalledWith(validText);
  });

  it("shows loading state during generation", () => {
    // Override the mock implementation for this test
    vi.spyOn(
      useGenerateFlashcardsModule,
      "useGenerateFlashcards"
    ).mockImplementation(() => ({
      generate: vi.fn(),
      suggestions: [],
      generationId: null,
      model: null,
      isLoading: true,
      error: null,
    }));

    render(<GenerateFlashcardsView />);

    expect(screen.getByTestId("skeleton-loader")).toBeInTheDocument();
  });

  it("displays error message when API returns error", async () => {
    const errorMessage = "API error occurred";

    // Override the mock implementation for this test
    vi.spyOn(
      useGenerateFlashcardsModule,
      "useGenerateFlashcards"
    ).mockImplementation(() => ({
      generate: vi.fn(),
      suggestions: [],
      generationId: null,
      model: null,
      isLoading: false,
      error: errorMessage,
    }));

    render(<GenerateFlashcardsView />);

    // Check if toast.error was called with the error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("renders suggestions when they are available", () => {
    // Override the mock implementation for this test
    vi.spyOn(
      useGenerateFlashcardsModule,
      "useGenerateFlashcards"
    ).mockImplementation(() => ({
      generate: vi.fn(),
      suggestions: mockSuggestions,
      generationId: "gen-123",
      model: "deepseek/deepseek-chat-v3-0324:free",
      isLoading: false,
      error: null,
    }));

    render(<GenerateFlashcardsView />);

    expect(screen.getByTestId("flashcard-list")).toBeInTheDocument();
    expect(screen.getByTestId("flashcard-0")).toBeInTheDocument();
    expect(screen.getByTestId("flashcard-1")).toBeInTheDocument();
  });

  it("updates status map when approving a flashcard", async () => {
    // Override the mock implementation for this test
    vi.spyOn(
      useGenerateFlashcardsModule,
      "useGenerateFlashcards"
    ).mockImplementation(() => ({
      generate: vi.fn(),
      suggestions: mockSuggestions,
      generationId: "gen-123",
      model: "deepseek/deepseek-chat-v3-0324:free",
      isLoading: false,
      error: null,
    }));

    const saveMock = vi.fn();
    vi.spyOn(useSaveFlashcardsModule, "useSaveFlashcards").mockImplementation(
      () => ({
        save: saveMock,
        isSaving: false,
        error: null,
        success: false,
      })
    );

    render(<GenerateFlashcardsView />);

    // Approve the first flashcard
    await user.click(screen.getByTestId("approve-0"));

    // The save button should now be enabled
    expect(screen.getByTestId("save-button")).not.toBeDisabled();

    // Click save button
    await user.click(screen.getByTestId("save-button"));

    // Check if save was called with the correct flashcards
    expect(saveMock).toHaveBeenCalledWith({
      flashcards: [
        {
          front: "Question 1",
          back: "Answer 1",
          source: "AI-full",
          generation_id: "gen-123",
        },
      ],
    });
  });

  it("handles the edit workflow correctly", async () => {
    // Override the mock implementation for this test
    vi.spyOn(
      useGenerateFlashcardsModule,
      "useGenerateFlashcards"
    ).mockImplementation(() => ({
      generate: vi.fn(),
      suggestions: mockSuggestions,
      generationId: "gen-123",
      model: "deepseek/deepseek-chat-v3-0324:free",
      isLoading: false,
      error: null,
    }));

    render(<GenerateFlashcardsView />);

    // Start editing the first flashcard
    await user.click(screen.getByTestId("edit-0"));

    // Save the edit
    await user.click(screen.getByTestId("save-edit-0"));

    // The save button should now be enabled
    expect(screen.getByTestId("save-button")).not.toBeDisabled();
  });

  it("shows success message after saving flashcards", async () => {
    // Override the mock implementation for this test
    vi.spyOn(
      useGenerateFlashcardsModule,
      "useGenerateFlashcards"
    ).mockImplementation(() => ({
      generate: vi.fn(),
      suggestions: mockSuggestions,
      generationId: "gen-123",
      model: "deepseek/deepseek-chat-v3-0324:free",
      isLoading: false,
      error: null,
    }));

    vi.spyOn(useSaveFlashcardsModule, "useSaveFlashcards").mockImplementation(
      () => ({
        save: vi.fn(),
        isSaving: false,
        error: null,
        success: true,
      })
    );

    render(<GenerateFlashcardsView />);

    // Check if toast.success was called
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Flashcards saved successfully."
      );
    });
  });

  it("shows error message when saving fails", async () => {
    const errorMessage = "Failed to save flashcards";

    // Override the mock implementation for this test
    vi.spyOn(
      useGenerateFlashcardsModule,
      "useGenerateFlashcards"
    ).mockImplementation(() => ({
      generate: vi.fn(),
      suggestions: mockSuggestions,
      generationId: "gen-123",
      model: "deepseek/deepseek-chat-v3-0324:free",
      isLoading: false,
      error: null,
    }));

    vi.spyOn(useSaveFlashcardsModule, "useSaveFlashcards").mockImplementation(
      () => ({
        save: vi.fn(),
        isSaving: false,
        error: errorMessage,
        success: false,
      })
    );

    render(<GenerateFlashcardsView />);

    // Check if toast.error was called with the error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });
});
