import { useState } from 'react';
import type { FC, ChangeEvent, FormEvent } from 'react';

interface FlashcardInputProps {
  onGenerate: (text: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Input component for entering text to generate flashcards
 */
export const FlashcardInput: FC<FlashcardInputProps> = ({
  onGenerate,
  isLoading = false,
}) => {
  const [text, setText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const MIN_LENGTH = 50;
  const MAX_LENGTH = 5000;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (text.trim().length < MIN_LENGTH) {
      setError(`Text must be at least ${MIN_LENGTH} characters long`);
      return;
    }

    if (text.trim().length > MAX_LENGTH) {
      setError(`Text must not exceed ${MAX_LENGTH} characters`);
      return;
    }

    try {
      await onGenerate(text.trim());
      setText(''); // Clear input after successful generation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
    }
  };

  const characterCount = text.length;
  const isValid = characterCount >= MIN_LENGTH && characterCount <= MAX_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="flashcard-text"
          className="block text-sm font-medium text-gray-700"
        >
          Enter text to generate flashcards
        </label>

        <textarea
          id="flashcard-text"
          value={text}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Paste your notes, textbook content, or any text you want to study..."
          rows={10}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
        />

        <div className="flex items-center justify-between text-sm">
          <span
            className={`${
              isValid
                ? 'text-gray-600'
                : characterCount < MIN_LENGTH
                  ? 'text-orange-600'
                  : 'text-red-600'
            }`}
          >
            {characterCount} / {MAX_LENGTH} characters
            {characterCount < MIN_LENGTH && ` (minimum ${MIN_LENGTH})`}
          </span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating flashcards...
          </span>
        ) : (
          'Generate Flashcards'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Tip: Longer, well-structured text produces better flashcards
      </p>
    </form>
  );
};
