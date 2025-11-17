import { FlashcardProposalItem } from './FlashcardProposalItem';
import type { FlashcardProposalViewModel } from '@/lib/types/flashcard.types';

interface FlashcardProposalsListProps {
  proposals: FlashcardProposalViewModel[];
  onAccept: (id: string) => void;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, front: string, back: string) => void;
  onCancelEdit: (id: string) => void;
  onReject: (id: string) => void;
}

export function FlashcardProposalsList({
  proposals,
  onAccept,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onReject,
}: FlashcardProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No proposals yet</p>
        <p className="text-sm mt-2">Generate flashcards from your text to see proposals here</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {proposals.map((proposal) => (
        <FlashcardProposalItem
          key={proposal.id}
          proposal={proposal}
          onAccept={onAccept}
          onStartEdit={onStartEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
