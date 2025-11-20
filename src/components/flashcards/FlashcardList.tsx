/**
 * FlashcardList Component
 * Displays all user's flashcards with search, edit, and delete functionality
 */
import { useState, useEffect } from 'react';
import { FlashcardItem } from './FlashcardItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/db/types';

export function FlashcardList() {
  const [flashcards, setFlashcards] = useState<Tables<'flashcards'>[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<Tables<'flashcards'>[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingFlashcard, setEditingFlashcard] = useState<Tables<'flashcards'> | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch flashcards on mount
  useEffect(() => {
    fetchFlashcards();
  }, []);

  // Filter flashcards when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFlashcards(flashcards);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = flashcards.filter(
        (card) =>
          card.front.toLowerCase().includes(query) ||
          card.back.toLowerCase().includes(query)
      );
      setFilteredFlashcards(filtered);
    }
  }, [searchQuery, flashcards]);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/flashcards');
      if (!response.ok) {
        throw new Error('Failed to fetch flashcards');
      }
      const result = await response.json();
      setFlashcards(result.data || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast.error('Failed to load flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (flashcard: Tables<'flashcards'>) => {
    setEditingFlashcard(flashcard);
    setEditFront(flashcard.front);
    setEditBack(flashcard.back);
  };

  const handleSaveEdit = async () => {
    if (!editingFlashcard) return;

    if (!editFront.trim() || !editBack.trim()) {
      toast.error('Both front and back are required');
      return;
    }

    if (editFront.length > 200) {
      toast.error('Front text exceeds maximum length of 200 characters');
      return;
    }

    if (editBack.length > 500) {
      toast.error('Back text exceeds maximum length of 500 characters');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/flashcards/${editingFlashcard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: editFront.trim(),
          back: editBack.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update flashcard');
      }

      toast.success('Flashcard updated successfully!');
      setEditingFlashcard(null);
      fetchFlashcards();
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update flashcard');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete flashcard');
      }

      toast.success('Flashcard deleted successfully!');
      fetchFlashcards();
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete flashcard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No flashcards yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first flashcard to start learning!
          </p>
          <Button
            onClick={() => window.location.href = '/generate'}
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Flashcards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search flashcards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredFlashcards.length === flashcards.length
            ? `${flashcards.length} flashcard${flashcards.length === 1 ? '' : 's'}`
            : `${filteredFlashcards.length} of ${flashcards.length} flashcards`}
        </p>
        <Button
          onClick={() => window.location.href = '/generate'}
          variant="outline"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add More
        </Button>
      </div>

      {/* Flashcards Grid */}
      {filteredFlashcards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No flashcards match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlashcards.map((flashcard) => (
            <FlashcardItem
              key={flashcard.id}
              flashcard={flashcard}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingFlashcard} onOpenChange={(open) => !open && setEditingFlashcard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>
              Make changes to your flashcard. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-front">Front</Label>
              <Input
                id="edit-front"
                value={editFront}
                onChange={(e) => setEditFront(e.target.value)}
                maxLength={200}
                placeholder="Question or term"
              />
              <p className="text-xs text-gray-500">{editFront.length}/200 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-back">Back</Label>
              <textarea
                id="edit-back"
                value={editBack}
                onChange={(e) => setEditBack(e.target.value)}
                maxLength={500}
                placeholder="Answer or definition"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
              <p className="text-xs text-gray-500">{editBack.length}/500 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingFlashcard(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
