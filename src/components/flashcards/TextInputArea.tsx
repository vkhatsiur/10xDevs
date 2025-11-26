import { Textarea } from '@/components/ui/textarea';
import { VALIDATION } from '@/lib/types/flashcard.types';

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export function TextInputArea({ value, onChange, disabled, error }: TextInputAreaProps) {
  const charCount = value.length;
  const isValid =
    charCount >= VALIDATION.SOURCE_TEXT_MIN && charCount <= VALIDATION.SOURCE_TEXT_MAX;
  const isTooShort = charCount > 0 && charCount < VALIDATION.SOURCE_TEXT_MIN;
  const isTooLong = charCount > VALIDATION.SOURCE_TEXT_MAX;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="source-text" className="text-sm font-medium">
          Source Text
        </label>
        <span
          className={`text-sm ${
            isTooShort
              ? 'text-orange-600'
              : isTooLong
                ? 'text-red-600'
                : isValid
                  ? 'text-green-600'
                  : 'text-muted-foreground'
          }`}
        >
          {charCount.toLocaleString()} / {VALIDATION.SOURCE_TEXT_MIN.toLocaleString()} -{' '}
          {VALIDATION.SOURCE_TEXT_MAX.toLocaleString()}
        </span>
      </div>

      <Textarea
        id="source-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={`Paste your text here (${VALIDATION.SOURCE_TEXT_MIN}-${VALIDATION.SOURCE_TEXT_MAX} characters)...`}
        className="min-h-[200px] font-mono text-sm"
        aria-describedby={error ? 'text-error' : undefined}
      />

      {error && (
        <p id="text-error" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!error && isTooShort && (
        <p className="text-sm text-orange-600">
          Need {(VALIDATION.SOURCE_TEXT_MIN - charCount).toLocaleString()} more characters
        </p>
      )}
    </div>
  );
}
