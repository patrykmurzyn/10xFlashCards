import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// This is just a simple example component for testing
function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <p data-testid="count">{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

describe("Example test suite", () => {
  it("renders counter with initial value of 0", () => {
    render(<Counter />);
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("increments counter when button is clicked", async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole("button", { name: /increment/i }));

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});
