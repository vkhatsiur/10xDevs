/**
 * Manual Flashcard Creation Form
 * Allows users to create flashcards manually without AI
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ManualFlashcard {
  id: string;
  front: string;
  back: string;
}

export function ManualFlashcardForm() {
  const [cards, setCards] = useState<ManualFlashcard[]>([
    { id: crypto.randomUUID(), front: '', back: '' },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addCard = () => {
    setCards([...cards, { id: crypto.randomUUID(), front: '', back: '' }]);
  };

  const removeCard = (id: string) => {
    if (cards.length === 1) {
      toast.error('You must have at least one flashcard');
      return;
    }
    setCards(cards.filter((card) => card.id !== id));
  };

  const updateCard = (id: string, field: 'front' | 'back', value: string) => {
    setCards(
      cards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    );
  };

  const handleSave = async () => {
    // Validate all cards
    const emptyCards = cards.filter(
      (card) => !card.front.trim() || !card.back.trim()
    );

    if (emptyCards.length > 0) {
      toast.error('All flashcards must have both front and back text');
      return;
    }

    // Validate length constraints
    const invalidCards = cards.filter(
      (card) => card.front.length > 200 || card.back.length > 500
    );

    if (invalidCards.length > 0) {
      toast.error('Front text max 200 chars, back text max 500 chars');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcards: cards.map((card) => ({
            front: card.front.trim(),
            back: card.back.trim(),
            source: 'manual',
            generation_id: null,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save flashcards');
      }

      const result = await response.json();
      toast.success(`${result.flashcards.length} flashcards saved successfully!`);

      // Reset form
      setCards([{ id: crypto.randomUUID(), front: '', back: '' }]);
    } catch (error) {
      console.error('Error saving flashcards:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save flashcards');
    } finally {
      setIsSaving(false);
    }
  };

  const hasValidCards = cards.some(
    (card) => card.front.trim() && card.back.trim()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Create Flashcards Manually</h2>
          <p className="text-sm text-muted-foreground">
            Add your own flashcards without AI generation
          </p>
        </div>
        <Button onClick={addCard} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="p-4 border border-gray-200 rounded-lg space-y-4 bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Card {index + 1}
              </span>
              {cards.length > 1 && (
                <Button
                  onClick={() => removeCard(card.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`front-${card.id}`}>
                Front <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`front-${card.id}`}
                type="text"
                placeholder="Question or term"
                value={card.front}
                onChange={(e) => updateCard(card.id, 'front', e.target.value)}
                maxLength={200}
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500">
                {card.front.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`back-${card.id}`}>
                Back <span className="text-red-500">*</span>
              </Label>
              <textarea
                id={`back-${card.id}`}
                placeholder="Answer or definition"
                value={card.back}
                onChange={(e) => updateCard(card.id, 'back', e.target.value)}
                maxLength={500}
                disabled={isSaving}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
              />
              <p className="text-xs text-gray-500">
                {card.back.length}/500 characters
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasValidCards || isSaving}
          size="lg"
          className="flex-1"
        >
          <Save className="mr-2 h-5 w-5" />
          {isSaving ? 'Saving...' : `Save ${cards.length} Flashcard${cards.length > 1 ? 's' : ''}`}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Manual flashcards are great for specific terms,
          formulas, or when you want full control over the content.
        </p>
      </div>
    </div>
  );
}
