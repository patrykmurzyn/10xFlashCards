import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaginationControls from "@/components/flashcards/PaginationControls";

describe("PaginationControls", () => {
  it("renders pagination buttons correctly", () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={3}
        totalPages={10}
        onPageChange={onPageChange}
      />
    );

    // Should show first page, current page and neighbors, and last page
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    // Current page should have aria-current="page"
    expect(screen.getByText("3").closest("button")).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("disables previous button on first page", () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    const prevButton = screen.getByLabelText("Go to previous page");
    expect(prevButton).toBeDisabled();

    const nextButton = screen.getByLabelText("Go to next page");
    expect(nextButton).not.toBeDisabled();
  });

  it("disables next button on last page", () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={5}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    const prevButton = screen.getByLabelText("Go to previous page");
    expect(prevButton).not.toBeDisabled();

    const nextButton = screen.getByLabelText("Go to next page");
    expect(nextButton).toBeDisabled();
  });

  it("calls onPageChange with correct page when buttons are clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    // Click next button
    await user.click(screen.getByLabelText("Go to next page"));
    expect(onPageChange).toHaveBeenCalledWith(4);

    // Click previous button
    await user.click(screen.getByLabelText("Go to previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);

    // Click specific page number
    await user.click(screen.getByText("5"));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it("doesn't render when there is only one page", () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={1}
        onPageChange={onPageChange}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
