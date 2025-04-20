import React from "react";

interface TextAreaWithCounterProps {
  value: string;
  onChange: (value: string) => void;
  minLength: number;
  maxLength: number;
}

const TextAreaWithCounter: React.FC<TextAreaWithCounterProps> = ({
  value,
  onChange,
  minLength,
  maxLength,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
  const length = value.length;
  const isTooShort = length < minLength;
  const isTooLong = length > maxLength;

  return (
    <div className="flex flex-col">
      <textarea
        className={
          `w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded p-4 resize-none h-64 focus:outline-none focus:ring-2 ` +
          (isTooShort || isTooLong
            ? "border-destructive focus:ring-destructive"
            : "border-gray-300 dark:border-gray-600 focus:ring-primary")
        }
        value={value}
        onChange={handleInputChange}
        minLength={minLength}
        maxLength={maxLength}
        aria-invalid={isTooShort || isTooLong}
        aria-describedby="source-text-count source-text-error"
        aria-label="Source Text"
      />
      <div className="flex justify-between items-center mt-1">
        <div
          id="source-text-count"
          className={`text-sm ${
            isTooShort || isTooLong ? "text-destructive" : "text-gray-500"
          }`}
        >
          {length} / {maxLength}
        </div>
        {isTooShort && (
          <div
            id="source-text-error"
            className="text-sm text-destructive"
            role="alert"
          >
            Minimum {minLength} characters required.
          </div>
        )}
      </div>
    </div>
  );
};

export default TextAreaWithCounter;
