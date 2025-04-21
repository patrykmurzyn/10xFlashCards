import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

type FormData = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordForm = () => {
  const [formData, setFormData] = useState<FormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const hasProcessedSessionRef = useRef(false);

  // Create the supabase client
  const supabase = createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL || "",
    import.meta.env.PUBLIC_SUPABASE_KEY || ""
  );

  useEffect(() => {
    if (hasProcessedSessionRef.current) return;

    // Function to check if URL contains a recovery token
    const checkForRecoveryToken = () => {
      const hash = window.location.hash;
      const hasToken =
        hash &&
        (hash.includes("type=recovery") || hash.includes("type=signup"));
      console.log("Checking for recovery token", { hash, hasToken });

      return !!hasToken; // Convert to boolean
    };

    // Listen for the session establishment event from the Astro component
    const handleSessionEstablished = async (event: CustomEvent) => {
      console.log("Session establishment event received:", event.detail);
      hasProcessedSessionRef.current = true;

      const { success, session, error } = event.detail;

      if (success && session) {
        console.log("Session was successfully established");
        setIsRecoveryMode(true);
        setSessionError("");
      } else {
        console.error("Session was not established:", error);

        // Even if session establishment failed, we're still in recovery mode if the URL has recovery token
        if (checkForRecoveryToken()) {
          setIsRecoveryMode(true);
          setSessionError(
            error ||
              "Could not validate your recovery link. Please request a new one."
          );
        } else {
          setIsRecoveryMode(false);
          setSessionError(
            "No valid recovery link found. Please request a reset password link from the sign-in page."
          );
        }
      }

      setIsCheckingSession(false);
    };

    // Add event listener for session establishment
    window.addEventListener(
      "supabaseSessionEstablished",
      handleSessionEstablished as unknown as EventListener
    );

    // Start with recovery mode based on URL, even before session check completes
    const initialRecoveryMode = checkForRecoveryToken();
    setIsRecoveryMode(initialRecoveryMode);

    // In case the event doesn't fire (if script execution order issues), set a timeout
    const timeoutId = setTimeout(() => {
      if (!hasProcessedSessionRef.current) {
        console.log("Session check timed out, using fallback");
        hasProcessedSessionRef.current = true;
        setIsCheckingSession(false);

        if (initialRecoveryMode) {
          setSessionError(
            "Could not validate your recovery link automatically. You can still try to reset your password."
          );
        } else {
          setSessionError(
            "No valid recovery link found. Please request a reset password link from the sign-in page."
          );
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener(
        "supabaseSessionEstablished",
        handleSessionEstablished as unknown as EventListener
      );
      clearTimeout(timeoutId);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors when user types
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      // Update user's password
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsSuccess(true);
      setMessage(
        "Your password has been successfully reset. You will be redirected to your dashboard."
      );

      // Clear form
      setFormData({
        password: "",
        confirmPassword: "",
      });

      // Redirect to dashboard after successful password reset
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="w-full max-w-md p-8 space-y-4 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold text-center text-white">
          Reset Your Password
        </h1>
        <div className="text-center text-gray-300">
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          Verifying your recovery link...
        </div>
      </div>
    );
  }

  // If not in recovery mode, show error message
  if (!isRecoveryMode) {
    return (
      <div className="w-full max-w-md p-8 space-y-4 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold text-center text-white">
          Invalid Recovery Link
        </h1>
        <div className="text-center text-red-400">
          {sessionError ||
            "No valid recovery link found. Please request a reset password link from the sign-in page."}
        </div>
        <div className="flex justify-center">
          <a
            href="/signin"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-center"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-xl">
      <div>
        <h1 className="text-2xl font-bold text-center text-white">
          Reset Your Password
        </h1>
        {sessionError && (
          <p className="mt-2 text-sm text-center text-yellow-400">
            {sessionError}
          </p>
        )}
      </div>

      {isSuccess ? (
        <div className="space-y-6">
          <div className="text-green-400 text-center">{message}</div>
          <div className="flex justify-center">
            <a
              href="/dashboard"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-center"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {message && <div className="text-red-400 text-center">{message}</div>}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 bg-gray-700 border ${
                errors.password ? "border-red-500" : "border-gray-600"
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 bg-gray-700 border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-600"
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordForm;
