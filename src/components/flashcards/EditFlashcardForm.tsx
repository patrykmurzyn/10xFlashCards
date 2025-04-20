import React from "react";

interface EditFlashcardFormProps {
  front: string;
  back: string;
  onChangeFront: (value: string) => void;
  onChangeBack: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditFlashcardForm: React.FC<EditFlashcardFormProps> = ({
  front,
  back,
  onChangeFront,
  onChangeBack,
  onSave,
  onCancel,
}) => {
  return (
    <div className="p-4 border-gray-600 bg-gray-800 rounded space-y-4 text-gray-100">
      <input
        className="w-full bg-gray-700 text-gray-100 border border-gray-500 rounded p-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
        value={front}
        onChange={(e) => onChangeFront(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Front"
        aria-label="Edit front text"
      />
      <textarea
        className="w-full bg-gray-700 text-gray-100 border border-gray-500 rounded p-2 placeholder-gray-400 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-primary"
        value={back}
        onChange={(e) => onChangeBack(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && e.ctrlKey) onSave();
        }}
        placeholder="Back (Ctrl+Enter to save)"
        aria-label="Edit back text"
      />
      <div className="flex space-x-2">
        <button
          className="bg-green-600 text-gray-100 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={onSave}
          aria-label="Save edited flashcard"
        >
          Save
        </button>
        <button
          className="bg-gray-600 text-gray-100 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
          onClick={onCancel}
          aria-label="Cancel editing"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditFlashcardForm;
