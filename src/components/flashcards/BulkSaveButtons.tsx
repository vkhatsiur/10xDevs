import { Button } from '@/components/ui/button';
import { Save, CheckCheck, Loader2 } from 'lucide-react';

interface BulkSaveButtonsProps {
  onSaveAll: () => void;
  onSaveAccepted: () => void;
  disabled: boolean;
  isSaving: boolean;
  totalCount: number;
  acceptedCount: number;
}

export function BulkSaveButtons({
  onSaveAll,
  onSaveAccepted,
  disabled,
  isSaving,
  totalCount,
  acceptedCount,
}: BulkSaveButtonsProps) {
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg border">
      <div className="flex-1">
        <p className="text-sm font-medium mb-1">Ready to save flashcards</p>
        <p className="text-xs text-muted-foreground">
          {acceptedCount} accepted • {totalCount} total
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onSaveAccepted}
          disabled={disabled || acceptedCount === 0 || isSaving}
          className="flex-1 sm:flex-none"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="mr-2 h-4 w-4" />
          )}
          Save Accepted ({acceptedCount})
        </Button>

        <Button
          onClick={onSaveAll}
          disabled={disabled || isSaving}
          variant="outline"
          className="flex-1 sm:flex-none"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save All ({totalCount})
        </Button>
      </div>
    </div>
  );
}
