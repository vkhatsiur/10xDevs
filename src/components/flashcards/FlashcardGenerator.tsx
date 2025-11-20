import { useFlashcardGeneration } from '@/lib/hooks/useFlashcardGeneration';
import { TextInputArea } from './TextInputArea';
import { FlashcardProposalsList } from './FlashcardProposalsList';
import { SkeletonLoader } from './SkeletonLoader';
import { BulkSaveButtons } from './BulkSaveButtons';
import { ErrorDisplay } from './ErrorDisplay';
import { ManualFlashcardForm } from './ManualFlashcardForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, PenLine } from 'lucide-react';
import { toast } from 'sonner';

export function FlashcardGenerator() {
  const {
    state,
    stats,
    canGenerate,
    canSave,
    updateSourceText,
    generateFlashcards,
    acceptProposal,
    startEditProposal,
    saveEditProposal,
    cancelEditProposal,
    rejectProposal,
    saveFlashcards,
    resetState,
  } = useFlashcardGeneration();

  const handleGenerate = async () => {
    await generateFlashcards();
    if (!state.generationError) {
      toast.success('Flashcards generated successfully!');
    }
  };

  const handleSaveAll = async () => {
    const result = await saveFlashcards(true);
    if (result) {
      toast.success(`${result.length} flashcards saved successfully!`);
      resetState();
    }
  };

  const handleSaveAccepted = async () => {
    const result = await saveFlashcards(false);
    if (result) {
      toast.success(`${result.length} flashcards saved successfully!`);
      resetState();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Flashcards</h1>
        <p className="text-muted-foreground">
          Generate flashcards with AI or create them manually
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generation
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            Manual Creation
          </TabsTrigger>
        </TabsList>

        {/* AI Generation Tab */}
        <TabsContent value="ai" className="mt-6">
          {/* Text Input Section */}
          <div className="mb-8 space-y-4">
            <TextInputArea
              value={state.sourceText}
              onChange={updateSourceText}
              disabled={state.isGenerating}
              error={state.textError}
            />

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Flashcards
            </Button>

            {state.generationError && (
              <ErrorDisplay
                title="Generation Failed"
                message={state.generationError}
              />
            )}
          </div>

          {/* Loading State */}
          {state.isGenerating && (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4">
                Generating flashcards... This may take a few seconds.
              </p>
              <SkeletonLoader />
            </div>
          )}

          {/* Proposals Section */}
          {!state.isGenerating && state.proposals.length > 0 && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Review Proposals</h2>
                  <p className="text-sm text-muted-foreground">
                    {stats.total} proposals • {stats.accepted} accepted • {stats.edited} edited
                  </p>
                </div>
              </div>

              {/* Proposals List */}
              <FlashcardProposalsList
                proposals={state.proposals}
                onAccept={acceptProposal}
                onStartEdit={startEditProposal}
                onSaveEdit={saveEditProposal}
                onCancelEdit={cancelEditProposal}
                onReject={rejectProposal}
              />

              {/* Save Buttons */}
              <BulkSaveButtons
                onSaveAll={handleSaveAll}
                onSaveAccepted={handleSaveAccepted}
                disabled={!canSave}
                isSaving={state.isSaving}
                totalCount={stats.total}
                acceptedCount={stats.accepted}
              />

              {state.saveError && (
                <ErrorDisplay
                  title="Save Failed"
                  message={state.saveError}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Manual Creation Tab */}
        <TabsContent value="manual" className="mt-6">
          <ManualFlashcardForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
