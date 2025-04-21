import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import FormField from "./FormField";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: (redirectTo?: string) => void;
  redirectTo?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectTo }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Clear field-specific error when typing
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }

    // Clear general error when typing
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setResendMessage(null);
    setResetMessage(null);
    setLoading(true);

    // Client-side validation
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    // Clear previous errors
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (
          response.status === 403 &&
          result.error?.includes("confirm your email")
        ) {
          setGeneralError(
            "Please confirm your email before logging in. If you haven't received the email, you can request a new one."
          );
        } else {
          setGeneralError(result.error || "Login failed. Please try again.");
        }
      } else {
        // Handle successful login
        onSuccess(redirectTo || undefined);
      }
    } catch (error) {
      console.error("Login fetch error:", error);
      setGeneralError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email || resendingEmail) return;

    setResendingEmail(true);
    setResendMessage(null);
    setGeneralError(null);

    try {
      // Create a request to resend verification email
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ email: formData.email, type: "signup" }),
      });

      const result = await response.json();

      if (!response.ok) {
        setGeneralError(result.error || "Failed to resend verification email.");
      } else {
        setResendMessage("Verification email sent. Please check your inbox.");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setGeneralError("Network error. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = resetPasswordMode ? resetPasswordEmail : formData.email;

    if (!email) {
      setGeneralError(
        "Please enter your email address to reset your password."
      );
      return;
    }

    setSendingResetEmail(true);
    setResetMessage(null);
    setGeneralError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setGeneralError(result.error || "Failed to send password reset email.");
      } else {
        setResetMessage("Password reset email sent. Please check your inbox.");
        if (resetPasswordMode) {
          // Back to login form after few seconds
          setTimeout(() => {
            setResetPasswordMode(false);
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setGeneralError("Network error. Please try again.");
    } finally {
      setSendingResetEmail(false);
    }
  };

  const isEmailConfirmationError = generalError?.includes("confirm your email");

  if (resetPasswordMode) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-medium text-center mb-4">Reset Password</h3>
        <p className="text-gray-300 text-sm mb-4">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <FormField
            id="resetEmail"
            label="Email"
            type="email"
            value={resetPasswordEmail}
            onChange={(e) => setResetPasswordEmail(e.target.value)}
            required
            autoComplete="email"
          />

          {generalError && (
            <div className="text-destructive text-sm" role="alert">
              {generalError}
            </div>
          )}

          {resetMessage && (
            <div
              className="bg-green-800 text-white p-2 rounded text-sm"
              role="status"
            >
              {resetMessage}
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button
              type="submit"
              variant="default"
              size="default"
              disabled={sendingResetEmail}
              className="w-full"
              aria-busy={sendingResetEmail}
            >
              {sendingResetEmail ? "Sending..." : "Send Reset Link"}
            </Button>

            <button
              type="button"
              onClick={() => setResetPasswordMode(false)}
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        hasError={!!errors.email}
        errorMessage={errors.email?.[0]}
        autoComplete="email"
      />

      <FormField
        id="password"
        label="Password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
        hasError={!!errors.password}
        errorMessage={errors.password?.[0]}
        autoComplete="current-password"
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setResetPasswordMode(true)}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Forgot Password?
        </button>
      </div>

      {generalError && (
        <div className="text-destructive text-sm" role="alert">
          {generalError}
        </div>
      )}

      {resendMessage && (
        <div
          className="bg-green-800 text-white p-2 rounded text-sm"
          role="status"
        >
          {resendMessage}
        </div>
      )}

      {resetMessage && (
        <div
          className="bg-green-800 text-white p-2 rounded text-sm"
          role="status"
        >
          {resetMessage}
        </div>
      )}

      {isEmailConfirmationError && (
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={resendingEmail || !formData.email}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium w-full text-center py-1"
        >
          {resendingEmail ? "Sending..." : "Resend verification email"}
        </button>
      )}

      <Button
        type="submit"
        variant="default"
        size="default"
        disabled={loading}
        className="w-full"
        aria-busy={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
};

export default LoginForm;
