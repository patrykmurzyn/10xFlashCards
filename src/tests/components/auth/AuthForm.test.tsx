import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/auth/AuthForm";

// Mock window.location for URL parameter tests
const mockLocation = {
  search: "",
  href: "",
};

// Store original window.location
const originalLocation = window.location;

// Mock the child components
vi.mock("@/components/auth/LoginForm", () => ({
  default: vi.fn(({ onSuccess, redirectTo }) => (
    <div data-testid="login-form">
      <button
        onClick={() => onSuccess(redirectTo)}
        data-testid="mock-login-button"
      >
        Mock Login
      </button>
      <div>Redirect to: {redirectTo || "none"}</div>
    </div>
  )),
}));

vi.mock("@/components/auth/RegisterForm", () => ({
  default: vi.fn(({ onSuccess }) => (
    <div data-testid="register-form">
      <button onClick={onSuccess} data-testid="mock-register-button">
        Mock Register
      </button>
    </div>
  )),
}));

describe("AuthForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window.location for URL parameter testing
    delete (window as any).location;
    window.location = { ...mockLocation } as any;
  });

  // Restore original window.location after tests
  afterEach(() => {
    window.location = originalLocation as unknown as Location & {
      href: string;
    };
  });

  it("renders the login form by default", () => {
    render(<AuthForm />);

    // Check that login tab is active
    const loginTab = screen.getByRole("button", {
      name: /login/i,
      pressed: true,
    });
    expect(loginTab).toBeInTheDocument();

    // Check that login form is visible
    expect(screen.getByTestId("login-form")).toBeInTheDocument();

    // Register form should not be visible
    expect(screen.queryByTestId("register-form")).not.toBeInTheDocument();
  });

  it("switches to register form when register tab is clicked", async () => {
    render(<AuthForm />);

    // Click the register tab
    await user.click(screen.getByRole("button", { name: /register/i }));

    // Register tab should be active now
    expect(
      screen.getByRole("button", { name: /register/i, pressed: true })
    ).toBeInTheDocument();

    // Login tab should not be active
    expect(
      screen.getByRole("button", { name: /login/i, pressed: false })
    ).toBeInTheDocument();

    // Register form should be visible
    expect(screen.getByTestId("register-form")).toBeInTheDocument();

    // Login form should not be visible
    expect(screen.queryByTestId("login-form")).not.toBeInTheDocument();
  });

  it("switches back to login form after successful registration", async () => {
    render(<AuthForm />);

    // Switch to register view
    await user.click(screen.getByRole("button", { name: /register/i }));

    // Complete the registration
    await user.click(screen.getByTestId("mock-register-button"));

    // It should switch back to login view
    expect(
      screen.getByRole("button", { name: /login/i, pressed: true })
    ).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("passes redirectTo parameter to login form", () => {
    // Set up URL parameter
    window.location.search = "?redirectTo=/flashcards";

    render(<AuthForm />);

    // Check if redirectTo param is passed to login form
    expect(screen.getByText("Redirect to: /flashcards")).toBeInTheDocument();
  });

  it("redirects to specified path after successful login", async () => {
    // Set up URL parameter
    window.location.search = "?redirectTo=/flashcards";

    render(<AuthForm />);

    // Click the mock login button
    await user.click(screen.getByTestId("mock-login-button"));

    // Check if window.location.href was updated
    expect(window.location.href).toBe("/flashcards");
  });

  it("redirects to dashboard by default after successful login", async () => {
    render(<AuthForm />);

    // Click the mock login button
    await user.click(screen.getByTestId("mock-login-button"));

    // Check if window.location.href was updated to default path
    expect(window.location.href).toBe("/dashboard");
  });

  it("displays verification success message when verification=success is in URL", () => {
    // Set up URL parameter
    window.location.search = "?verification=success";

    render(<AuthForm />);

    // Success message should be visible
    expect(
      screen.getByText(/your email has been verified successfully/i)
    ).toBeInTheDocument();

    // The message should have success styling (green background)
    const alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass("bg-green-800");
  });

  it("displays password reset success message when password_reset=success is in URL", () => {
    // Set up URL parameter
    window.location.search = "?password_reset=success";

    render(<AuthForm />);

    // Success message should be visible
    expect(
      screen.getByText(/your password has been reset successfully/i)
    ).toBeInTheDocument();

    // The message should have success styling (green background)
    const alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass("bg-green-800");
  });

  it("displays error message when error parameters are present in URL", () => {
    // Set up URL parameter for expired OTP
    window.location.search = "?error=access_denied&error_code=otp_expired";

    render(<AuthForm />);

    // Error message should be visible
    expect(
      screen.getByText(/verification link has expired/i)
    ).toBeInTheDocument();

    // The message should have error styling (amber background)
    const alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass("bg-amber-800");
  });

  it("displays session error message when session_error is in URL", () => {
    // Set up URL parameter
    window.location.search = "?error=session_error";

    render(<AuthForm />);

    // Error message should be visible
    expect(screen.getByText(/your session has expired/i)).toBeInTheDocument();

    // The message should have error styling (amber background)
    const alertElement = screen.getByRole("alert");
    expect(alertElement).toHaveClass("bg-amber-800");
  });
});
