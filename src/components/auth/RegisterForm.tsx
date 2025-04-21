import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import FormField from "./FormField";
import { z } from "zod";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);
    setLoading(true);

    // Client-side validation
    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      setLoading(false);
      return;
    }

    // Clear previous errors
    setErrors({});

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setGeneralError(
          result.error || "Registration failed. Please try again."
        );
      } else {
        // Handle successful registration
        setSuccessMessage(
          "Registration successful! Please check your email to confirm your account."
        );
        setTimeout(() => {
          onSuccess();
        }, 5000);
      }
    } catch (error) {
      console.error("Registration fetch error:", error);
      setGeneralError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
        autoComplete="new-password"
      />

      <FormField
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        hasError={!!errors.confirmPassword}
        errorMessage={errors.confirmPassword?.[0]}
        autoComplete="new-password"
      />

      {generalError && (
        <div className="text-destructive text-sm" role="alert">
          {generalError}
        </div>
      )}

      {successMessage && (
        <div
          className="bg-green-800 text-white p-3 rounded-md text-sm"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <Button
        type="submit"
        variant="default"
        size="default"
        disabled={loading || !!successMessage}
        className="w-full"
        aria-busy={loading}
      >
        {loading ? "Registering..." : "Register"}
      </Button>
    </form>
  );
};

export default RegisterForm;
