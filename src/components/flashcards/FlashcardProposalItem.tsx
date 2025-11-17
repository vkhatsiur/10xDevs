import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, X, Edit2, Save, XCircle } from 'lucide-react';
import type { FlashcardProposalViewModel } from '@/lib/types/flashcard.types';
import { VALIDATION } from '@/lib/types/flashcard.types';

interface FlashcardProposalItemProps {
  proposal: FlashcardProposalViewModel;
  onAccept: (id: string) => void;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, front: string, back: string) => void;
  onCancelEdit: (id: string) => void;
  onReject: (id: string) => void;
}

export function FlashcardProposalItem({
  proposal,
  onAccept,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onReject,
}: FlashcardProposalItemProps) {
  const [editFront, setEditFront] = useState(proposal.front);
  const [editBack, setEditBack] = useState(proposal.back);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = () => {
    // Validate
    if (editFront.length === 0) {
      setEditError('Front text cannot be empty');
      return;
    }
    if (editBack.length === 0) {
      setEditError('Back text cannot be empty');
      return;
    }
    if (editFront.length > VALIDATION.FLASHCARD_FRONT_MAX) {
      setEditError(`Front text must be no more than ${VALIDATION.FLASHCARD_FRONT_MAX} characters`);
      return;
    }
    if (editBack.length > VALIDATION.FLASHCARD_BACK_MAX) {
      setEditError(`Back text must be no more than ${VALIDATION.FLASHCARD_BACK_MAX} characters`);
      return;
    }

    setEditError(null);
    onSaveEdit(proposal.id, editFront, editBack);
  };

  const handleCancelEdit = () => {
    setEditFront(proposal.front);
    setEditBack(proposal.back);
    setEditError(null);
    onCancelEdit(proposal.id);
  };

  return (
    <Card
      className={`transition-all ${
        proposal.accepted
          ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
          : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={proposal.source === 'ai-edited' ? 'secondary' : 'outline'}>
            {proposal.source === 'ai-edited' ? 'Edited' : 'AI Generated'}
          </Badge>
          {proposal.accepted && (
            <Badge variant="default" className="bg-green-600">
              <Check className="mr-1 h-3 w-3" />
              Accepted
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {proposal.editing ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Front ({editFront.length}/{VALIDATION.FLASHCARD_FRONT_MAX})</label>
              <Textarea
                value={editFront}
                onChange={(e) => setEditFront(e.target.value)}
                className="min-h-[80px]"
                placeholder="Question or term..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Back ({editBack.length}/{VALIDATION.FLASHCARD_BACK_MAX})</label>
              <Textarea
                value={editBack}
                onChange={(e) => setEditBack(e.target.value)}
                className="min-h-[120px]"
                placeholder="Answer or definition..."
              />
            </div>

            {editError && (
              <p className="text-sm text-red-600">{editError}</p>
            )}
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Front</p>
              <p className="text-sm">{proposal.front}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Back</p>
              <p className="text-sm">{proposal.back}</p>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        {proposal.editing ? (
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              onClick={handleSaveEdit}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelEdit}
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              variant={proposal.accepted ? 'outline' : 'default'}
              onClick={() => onAccept(proposal.id)}
              className="flex-1"
            >
              <Check className="mr-2 h-4 w-4" />
              {proposal.accepted ? 'Accepted' : 'Accept'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartEdit(proposal.id)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(proposal.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
