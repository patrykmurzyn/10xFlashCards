import React, { useState, useEffect } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Extract parameters from URL query parameters on component mount
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get("redirectTo"));

    // Check verification status
    const verification = params.get("verification");
    if (verification === "success") {
      setVerificationStatus(
        "Your email has been verified successfully. You can now log in."
      );
    }

    // Check password reset status
    const passwordReset = params.get("password_reset");
    if (passwordReset === "success") {
      setVerificationStatus(
        "Your password has been reset successfully. You can now log in with your new password."
      );
    }

    // Check if there's an error parameter
    const error = params.get("error");
    const errorCode = params.get("error_code");

    if (error === "access_denied" && errorCode === "otp_expired") {
      setVerificationStatus(
        "The verification link has expired. Please request a new one."
      );
    } else if (error === "session_error") {
      setVerificationStatus("Your session has expired. Please log in again.");
    }
  }, []);

  const handleLoginSuccess = (redirectPath?: string) => {
    // Redirect after successful login
    window.location.href = redirectPath || "/dashboard";
  };

  const handleRegisterSuccess = () => {
    // Switch to login view after successful registration
    setIsLogin(true);
  };

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-md overflow-hidden shadow-lg">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-center text-gray-100 mb-4">
          10xFlashCards
        </h1>
        <div className="flex bg-gray-700 rounded-t-md overflow-hidden">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 px-6 py-3 text-center font-semibold transition-colors ${
              isLogin
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:bg-gray-800"
            }`}
            aria-pressed={isLogin}
            aria-controls="auth-form-content"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 px-6 py-3 text-center font-semibold transition-colors ${
              !isLogin
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:bg-gray-800"
            }`}
            aria-pressed={!isLogin}
            aria-controls="auth-form-content"
          >
            Register
          </button>
        </div>
      </div>

      {verificationStatus && (
        <div
          className={`mx-6 p-3 mb-4 rounded-md ${
            verificationStatus.includes("success")
              ? "bg-green-800 text-white"
              : "bg-amber-800 text-white"
          }`}
          role="alert"
        >
          {verificationStatus}
        </div>
      )}

      <div id="auth-form-content" className="p-6">
        {isLogin ? (
          <LoginForm onSuccess={handleLoginSuccess} redirectTo={redirectTo} />
        ) : (
          <RegisterForm onSuccess={handleRegisterSuccess} />
        )}
      </div>
    </div>
  );
};

export default AuthForm;
