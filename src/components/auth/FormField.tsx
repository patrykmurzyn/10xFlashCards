import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  autoComplete?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  required = false,
  hasError = false,
  errorMessage,
  autoComplete,
}) => {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-100">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={`mt-1 block w-full px-4 py-2 bg-gray-700 border ${
          hasError ? "border-red-500" : "border-gray-600"
        } rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary`}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        autoComplete={autoComplete}
      />
      {hasError && errorMessage && (
        <p id={`${id}-error`} className="text-destructive text-sm" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default FormField;
