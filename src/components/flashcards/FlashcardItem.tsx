/**
 * FlashcardItem Component
 * Displays a single flashcard with flip animation
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, RotateCw } from 'lucide-react';
import type { Tables } from '@/db/types';

interface FlashcardItemProps {
  flashcard: Tables<'flashcards'>;
  onEdit: (flashcard: Tables<'flashcards'>) => void;
  onDelete: (id: number) => void;
}

export function FlashcardItem({ flashcard, onEdit, onDelete }: FlashcardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      'ai-full': { label: 'AI Generated', color: 'bg-blue-100 text-blue-700' },
      'ai-edited': { label: 'AI Edited', color: 'bg-purple-100 text-purple-700' },
      manual: { label: 'Manual', color: 'bg-green-100 text-green-700' },
    };
    return badges[source as keyof typeof badges] || badges.manual;
  };

  const badge = getSourceBadge(flashcard.source);

  return (
    <div className="relative group" data-testid={`flashcard-item-${flashcard.id}`}>
      {/* Flashcard Container */}
      <div
        className="relative h-64 cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
        data-testid={`flashcard-card-${flashcard.id}`}
      >
        {/* Flip Container */}
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Side */}
          <div
            className="absolute w-full h-full backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="w-full h-full bg-white border-2 border-gray-200 rounded-lg shadow-md p-6 flex flex-col">
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-xs text-gray-500">Front</span>
              </div>

              {/* Question */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xl font-semibold text-gray-900 text-center break-words">
                  {flashcard.front}
                </p>
              </div>

              {/* Flip Hint */}
              <div className="flex items-center justify-center text-xs text-gray-400 mt-4">
                <RotateCw className="h-3 w-3 mr-1" />
                Click to flip
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div
            className="absolute w-full h-full backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="w-full h-full bg-blue-50 border-2 border-blue-200 rounded-lg shadow-md p-6 flex flex-col">
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-xs text-blue-600">Back</span>
              </div>

              {/* Answer */}
              <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <p className="text-lg text-gray-800 text-center break-words">{flashcard.back}</p>
              </div>

              {/* Flip Hint */}
              <div className="flex items-center justify-center text-xs text-blue-400 mt-4">
                <RotateCw className="h-3 w-3 mr-1" />
                Click to flip
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(flashcard);
          }}
          variant="outline"
          size="sm"
          className="flex-1"
          data-testid={`edit-flashcard-${flashcard.id}`}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(flashcard.id);
          }}
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          data-testid={`delete-flashcard-${flashcard.id}`}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}
