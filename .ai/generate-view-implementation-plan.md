# Flashcard Generation View Implementation Plan

## 1. Overview
The view allows users to input text (1000-10000 characters) and send it to the API to generate AI flashcard proposals. Users can then review, accept, edit, or reject the generated proposals. Finally, they can save all or only accepted flashcards to the database.

## 2. View Routing
The view should be accessible at `/generate` path.

## 3. Component Structure
- **FlashcardGenerator** (Astro page with React island)
  - **TextInputArea** - Text input field component for pasting text
  - **GenerateButton** - Button initiating flashcard generation process
  - **FlashcardProposalsList** - List displaying flashcard proposals from API
    - **FlashcardProposalItem** - Single list item representing one flashcard proposal
  - **SkeletonLoader** - Loading indicator (skeleton), displayed while waiting for API response
  - **BulkSaveButtons** - Buttons for saving all flashcards or only accepted ones
  - **ErrorDisplay** - Component for displaying error messages

## 4. Component Details

### FlashcardGenerator (Main View)
- **Description**: Main view integrating all components needed for generating and reviewing flashcards.
- **Elements**: Text field, generate button, flashcard list, loader, and error messages.
- **Handled Events**: Text field value change, generate button click, flashcard interactions (accept, edit, reject), save button click.
- **Validation Conditions**: Text must be 1000-10000 characters long.
- **Types**: Uses `GenerateFlashcardsCommand` and `GenerationCreateResponseDto` types.
- **Props**: May receive callback functions for save confirmation or post-save redirection.
- **Implementation**: Astro page at `src/pages/generate.astro` with React island for interactivity.

### TextInputArea
- **Description**: Component enabling user text input.
- **Elements**: Text field (textarea) with placeholder and label.
- **Handled Events**: onChange to update text value state.
- **Validation Conditions**: Real-time text length validation (1000-10000 characters).
- **Types**: Local string state, `GenerateFlashcardsCommand` type when sending.
- **Props**: value, onChange, placeholder, error message.
- **shadcn/ui**: Use `Textarea` component.

### GenerateButton
- **Description**: Button to launch flashcard generation process.
- **Elements**: HTML button with "Generate Flashcards" label.
- **Handled Events**: onClick calling API request function.
- **Validation Conditions**: Enabled only if text value meets length requirements.
- **Types**: Callback function on click.
- **Props**: onClick, disabled (based on validation and loading state).
- **shadcn/ui**: Use `Button` component with primary variant.

### FlashcardProposalsList
- **Description**: Component displaying list of flashcard proposals from API.
- **Elements**: List (grid layout) containing multiple FlashcardProposalItem.
- **Handled Events**: Passing events to individual cards (accept, edit, reject).
- **Validation Conditions**: None - incoming API data is already validated.
- **Types**: Array of `FlashcardProposalViewModel` objects.
- **Props**: flashcards (proposal list), onAccept, onEdit, onReject.

### FlashcardProposalItem
- **Description**: Single card presenting one flashcard proposal.
- **Elements**: Display of front and back text, three buttons: "Accept", "Edit", "Reject".
- **Handled Events**: onClick for each button modifying card state (e.g., marking as accepted, opening edit mode, removing from list).
- **Validation Conditions**: If edit is active, input must meet: front ≤ 200 chars, back ≤ 500 chars.
- **Types**: Extended `FlashcardProposalViewModel` type, local state model with accepted/edited flags.
- **Props**: flashcard (proposal data), onAccept, onEdit, onReject.
- **shadcn/ui**: Use `Card` component with inline edit fields (when editing).
- **States**:
  - Default: Shows front/back with Accept/Edit/Reject buttons
  - Accepted: Green border, checkmark indicator
  - Editing: Inline textarea fields with Save/Cancel buttons
  - Rejected: Removed from list

### SkeletonLoader
- **Description**: Loading visualization component (skeleton).
- **Elements**: UI template (skeleton) imitating card structure to be displayed.
- **Handled Events**: No user interaction.
- **Validation Conditions**: Not applicable.
- **Types**: Stateless.
- **Props**: May accept optional styling parameters.
- **shadcn/ui**: Use `Skeleton` component.

### ErrorDisplay
- **Description**: Component displaying error messages (e.g., API errors or form validation).
- **Elements**: Text message, error icon.
- **Handled Events**: None - informational component.
- **Validation Conditions**: Passed message should not be empty.
- **Types**: String (error message).
- **Props**: message, error type.
- **shadcn/ui**: Use `Alert` component with destructive variant.

### BulkSaveButtons
- **Description**: Component contains buttons enabling batch save of all generated flashcards or only accepted ones. Allows sending data to backend in one request.
- **Elements**: Two buttons: "Save All" and "Save Accepted".
- **Handled Events**: onClick for each button calling appropriate API request function.
- **Validation Conditions**: Enabled only when flashcards exist to save; flashcard data must meet validation (front ≤ 200 chars, back ≤ 500 chars).
- **Types**: Uses types defined in API types, including `FlashcardsCreateCommand` interface (based on `FlashcardCreateDto`).
- **Props**: onSaveAll, onSaveAccepted, disabled, acceptedCount, totalCount.
- **shadcn/ui**: Use `Button` component.

## 5. Types

### Frontend Types (to create in `src/lib/types/flashcard.types.ts`)

```typescript
// API Request/Response Types
export interface GenerateFlashcardsCommand {
  source_text: string;
}

export interface GenerationCreateResponseDto {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
  generation_duration: number;
  model: string;
}

export interface FlashcardProposalDto {
  front: string;
  back: string;
  source: 'ai-full';
}

// View Model Types (Frontend State)
export interface FlashcardProposalViewModel extends FlashcardProposalDto {
  id: string; // temporary client-side ID
  accepted: boolean;
  editing: boolean;
  source: 'ai-full' | 'ai-edited';
}

export interface FlashcardsCreateCommand {
  flashcards: FlashcardCreateDto[];
}

export interface FlashcardCreateDto {
  front: string;
  back: string;
  source: 'ai-full' | 'ai-edited' | 'manual';
  generation_id: number | null;
}

// Component State Types
export interface GenerateViewState {
  sourceText: string;
  isGenerating: boolean;
  proposals: FlashcardProposalViewModel[];
  generationId: number | null;
  error: string | null;
  isSaving: boolean;
}
```

## 6. State Management

State will be managed using React hooks (useState, useEffect). Key states:
- **textValue**: Text field value (string)
- **isLoading**: Loading state for API call (boolean)
- **errorMessage**: Error message state (string | null)
- **flashcards**: List of flashcard proposals with local flags (FlashcardProposalViewModel[])
- **generationId**: ID from generation response (number | null)
- **editingCardId**: Currently editing card ID (string | null)
- **isSaving**: Saving state for batch save (boolean)

Separate API logic into custom hook (e.g., `useFlashcardGeneration`) to handle API logic.

## 7. API Integration

### Endpoint Integration:
- **POST /api/generations**: Send `GenerateFlashcardsCommand` { source_text } and receive response with generation_id, flashcards_proposals, and generated_count.
- **POST /api/flashcards**: After selecting flashcards via BulkSaveButtons, send POST /api/flashcards. Request uses `FlashcardsCreateCommand` type containing flashcard object array (each must have front ≤200 chars, back ≤500 chars, appropriate source, and generation_id) enabling database save.
- **Response Validation**: Check HTTP status, handle 400 (validation) and 500 (server error) errors.

### Custom Hook: `useFlashcardGeneration`

```typescript
export function useFlashcardGeneration() {
  const [state, setState] = useState<GenerateViewState>({
    sourceText: '',
    isGenerating: false,
    proposals: [],
    generationId: null,
    error: null,
    isSaving: false,
  });

  const generateFlashcards = async (sourceText: string) => {
    // Implementation
  };

  const saveFlashcards = async (flashcards: FlashcardCreateDto[]) => {
    // Implementation
  };

  const acceptProposal = (id: string) => {
    // Implementation
  };

  const editProposal = (id: string, front: string, back: string) => {
    // Implementation
  };

  const rejectProposal = (id: string) => {
    // Implementation
  };

  return {
    state,
    generateFlashcards,
    saveFlashcards,
    acceptProposal,
    editProposal,
    rejectProposal,
  };
}
```

## 8. User Interactions

1. User pastes text into text field.
2. After clicking "Generate Flashcards" button:
   - Text length validation begins.
   - If validation passes, API request is sent.
   - During wait, SkeletonLoader is displayed and button is disabled.
3. After receiving response, FlashcardProposalItem list is displayed.
4. Each card enables:
   - **Accept**: Mark proposal for saving (green border, checkmark).
   - **Edit**: Open edit mode with inline fields, validation, mark as 'ai-edited'.
   - **Reject**: Remove proposal from list.
5. `BulkSaveButtons` component enables sending selected flashcards for database save (POST /api/flashcards call).
6. After successful save, show success toast and optionally redirect to /flashcards.

## 9. Conditions and Validation

### Client-Side Validation
- **Text field**: Length must be 1000-10000 characters.
- **During flashcard edit**: front ≤ 200 chars, back ≤ 500 chars.
- **Generate button**: Enabled only with valid text.
- **Save buttons**: Enabled only when flashcards exist to save.

### Server-Side Validation (Already Implemented)
- API validates all inputs using Zod schemas
- Returns 400 with validation errors if data invalid

## 10. Error Handling

- Display validation error messages in ErrorDisplay component.
- Handle API errors (status 400 and 500): Display appropriate messages with retry option.
- On flashcard save failure, reset loading state and inform user.
- Network errors: Display "Network error, please try again" message.

## 11. Loading States

- **Generating**: Show skeleton cards (3-5 skeletons)
- **Saving**: Disable all buttons, show loading spinner on save button
- **No proposals**: Show empty state with helpful message

## 12. Implementation Steps

### Phase 1: Setup and Components (shadcn/ui)
1. ✅ Initialize shadcn/ui
2. Install required shadcn components:
   - `npx shadcn@latest add button`
   - `npx shadcn@latest add textarea`
   - `npx shadcn@latest add card`
   - `npx shadcn@latest add skeleton`
   - `npx shadcn@latest add toast`
   - `npx shadcn@latest add alert`
   - `npx shadcn@latest add badge`

### Phase 2: Types and State
3. Create `src/lib/types/flashcard.types.ts` with all necessary types.
4. Create custom hook `src/lib/hooks/useFlashcardGeneration.ts`.

### Phase 3: Components
5. Create `src/components/flashcards/TextInputArea.tsx` with validation.
6. Create `src/components/flashcards/FlashcardProposalItem.tsx` with accept/edit/reject actions.
7. Create `src/components/flashcards/FlashcardProposalsList.tsx`.
8. Create `src/components/flashcards/SkeletonLoader.tsx`.
9. Create `src/components/flashcards/BulkSaveButtons.tsx`.

### Phase 4: Main View
10. Create main view page `src/pages/generate.astro`.
11. Implement main `FlashcardGenerator` React component.
12. Integrate all subcomponents.

### Phase 5: Integration
13. Connect to POST /api/generations endpoint.
14. Implement proposal display and state management.
15. Connect to POST /api/flashcards endpoint for batch save.

### Phase 6: Polish
16. Add error handling and display.
17. Implement toast notifications.
18. Test all user interaction scenarios (correct and error cases).
19. Improve responsiveness and accessibility.
20. Final code review and refactoring before deployment.

## 13. Accessibility Requirements

- **Keyboard Navigation**: All interactive elements accessible via keyboard.
- **Screen Readers**: Proper ARIA labels on all buttons and inputs.
- **Focus Management**: Clear focus indicators, proper tab order.
- **Error Messages**: Associated with form fields via aria-describedby.
- **Loading States**: Announced to screen readers via aria-live regions.

## 14. Responsive Design

- **Mobile (< 640px)**: Single column layout, full-width cards.
- **Tablet (640px - 1024px)**: Two-column grid for proposals.
- **Desktop (> 1024px)**: Three-column grid for proposals.
- **Touch Targets**: Minimum 44x44px for mobile.

## 15. Testing Checklist

- [ ] Text input validation (too short, too long, valid)
- [ ] Generate button disabled/enabled states
- [ ] API error handling (network, 400, 500)
- [ ] Accept/edit/reject proposal interactions
- [ ] Inline editing with validation
- [ ] Save all flashcards
- [ ] Save only accepted flashcards
- [ ] Loading states (skeleton, button spinners)
- [ ] Toast notifications
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Mobile responsiveness
- [ ] Empty states
- [ ] Success flow (generate → edit → save → redirect)

## 16. Future Enhancements (Post-Module 2)

- Auto-save drafts to localStorage
- Undo/redo functionality
- Bulk edit mode
- Export proposals to JSON
- AI regeneration for individual cards
- Difficulty level selection
- Custom prompts for generation
