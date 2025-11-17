# API Endpoint Implementation Plan: POST /api/generations

## 1. Endpoint Overview

The `POST /api/generations` endpoint initiates the AI generation process to create flashcard proposals based on user-provided text.

**Key Characteristics**:
- Accepts source text (1000-10000 characters)
- Calls external AI service (OpenRouter) to generate proposals
- Creates generation record with metadata
- Returns flashcard **proposals** (NOT saved to flashcards table)
- User must manually accept and save proposals via `POST /api/flashcards`

**Important**: This endpoint does **NOT** automatically save flashcards. It only returns proposals that the user can review and selectively save.

---

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
`/api/generations`

### Request Body

```json
{
  "source_text": "Long educational text between 1000 and 10000 characters that will be used to generate flashcards..."
}
```

### Required Parameters

#### `source_text` (string)
- **Required**: Yes
- **Type**: string
- **Min length**: 1000 characters
- **Max length**: 10000 characters
- **Description**: Source text from which flashcards will be generated

### Optional Parameters
None

---

## 3. Used Types

```typescript
// Request types
interface GenerateFlashcardsRequest {
  source_text: string;
}

// Response types
interface FlashcardProposal {
  front: string;
  back: string;
  source: 'ai-full';
}

interface GenerationCreateResponse {
  generation_id: number;
  flashcards_proposals: FlashcardProposal[];
  generated_count: number;
  generation_duration: number;
  model: string;
}

// Error logging types
interface GenerationErrorLog {
  user_id: string;
  model: string;
  source_text_hash: string;
  source_text_length: number;
  error_code: string;
  error_message: string;
}
```

---

## 4. Response Details

### Success Response

**Status Code**: `201 Created`

**Response Body**:
```json
{
  "generation_id": 123,
  "flashcards_proposals": [
    {
      "front": "What is TypeScript?",
      "back": "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
      "source": "ai-full"
    },
    {
      "front": "What are the main benefits of TypeScript?",
      "back": "Type safety, better IDE support, early error detection, improved code maintainability, and enhanced developer productivity.",
      "source": "ai-full"
    },
    {
      "front": "How does TypeScript relate to JavaScript?",
      "back": "TypeScript is a superset of JavaScript that compiles to plain JavaScript. All valid JavaScript code is also valid TypeScript code.",
      "source": "ai-full"
    }
  ],
  "generated_count": 3,
  "generation_duration": 3500,
  "model": "openai/gpt-4o-mini"
}
```

### Error Responses

#### 400 Bad Request
**Cause**: Invalid source text length

```json
{
  "error": "Validation failed",
  "message": "Source text must be between 1000 and 10000 characters",
  "details": {
    "source_text_length": 850,
    "min_length": 1000,
    "max_length": 10000
  }
}
```

#### 401 Unauthorized
**Cause**: Missing or invalid authentication token

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 500 Internal Server Error
**Cause**: AI service error or database error

```json
{
  "error": "Internal server error",
  "message": "Failed to generate flashcards"
}
```

**Note**: Detailed errors are logged to `generation_error_logs` table

---

## 5. Data Flow

```
1. Client sends POST request with source_text
   ↓
2. API endpoint receives request (src/pages/api/generations/index.ts)
   ↓
3. Verify user authentication (get user_id)
   ↓
4. Validate source_text length (1000-10000 chars)
   ↓
5. Hash source text (SHA-256) for privacy and duplicate detection
   ↓
6. Record start time for duration tracking
   ↓
7. Call OpenRouterService.generateFlashcards(source_text)
   ↓
8. OpenRouter API returns proposals
   ↓
9. Calculate generation_duration (end time - start time)
   ↓
10. Create generation record in database
    - user_id, model, generated_count
    - source_text_hash, source_text_length
    - generation_duration
   ↓
11. Return proposals to client (NOT saved to flashcards)
   ↓
12. User reviews proposals in UI
   ↓
13. User selects which proposals to keep
   ↓
14. User saves selected proposals via POST /api/flashcards
```

### Error Flow

```
If AI service fails:
   ↓
1. Catch error
   ↓
2. Log to generation_error_logs table
   - error_code, error_message
   - model, source_text_hash, source_text_length
   - user_id
   ↓
3. Return 500 error to client
   ↓
4. Client shows user-friendly error message
```

---

## 6. Security Considerations

### Authentication
- **Requirement**: User must be authenticated
- **Implementation**: Verify Supabase Auth token (Module 3)
- **MVP**: Use hardcoded test user ID

### Input Validation
- **Length validation**: Enforce 1000-10000 character limit
- **Sanitization**: Clean text before sending to AI
- **SQL Injection**: Use parameterized queries
- **XSS Protection**: Sanitize AI-generated content

### Privacy
- **Source text**: NEVER stored in database
- **Hashing**: Use SHA-256 hash for duplicate detection
- **Error logs**: Don't include source_text, only hash and length

### API Key Protection
- **OpenRouter API key**: Store in environment variables
- **Never expose**: Don't include in client-side code
- **Rotation**: Regular key rotation (production)

### Rate Limiting (Module 3)
- **Generation limit**: 10 per hour per user
- **Cost control**: Prevent API abuse
- **Monitoring**: Track usage patterns

---

## 7. Error Handling

### Validation Errors (400)

```typescript
// Too short
{
  error: "Validation failed",
  message: "Source text must be at least 1000 characters",
  details: {
    source_text_length: 850,
    min_length: 1000
  }
}

// Too long
{
  error: "Validation failed",
  message: "Source text must be 10000 characters or less",
  details: {
    source_text_length: 15000,
    max_length: 10000
  }
}

// Missing
{
  error: "Validation failed",
  message: "source_text is required"
}
```

### AI Service Errors (500)

Error codes logged to database:

| Error Code | Description | Recovery |
|------------|-------------|----------|
| `API_TIMEOUT` | Request timeout (> 60s) | Retry with same text |
| `API_RATE_LIMIT` | OpenRouter rate limit exceeded | Wait and retry later |
| `API_AUTH_ERROR` | Invalid API key | Check configuration |
| `INVALID_JSON` | AI returned invalid JSON | Retry or adjust prompt |
| `EMPTY_RESPONSE` | AI returned empty response | Retry |
| `HTTP_4XX` | OpenRouter client error | Check request format |
| `HTTP_5XX` | OpenRouter server error | Retry later |

### Database Errors (500)
- Failed to create generation record
- Failed to insert error log
- Connection timeout

### Error Logging

```typescript
// Logged to generation_error_logs table
{
  user_id: "00000000-0000-0000-0000-000000000001",
  model: "openai/gpt-4o-mini",
  source_text_hash: "abc123def456...",
  source_text_length: 2500,
  error_code: "API_TIMEOUT",
  error_message: "Request timeout after 60 seconds",
  created_at: "2025-11-17T10:00:00Z"
}
```

---

## 8. Performance Considerations

### Timeout Configuration
- **OpenRouter API timeout**: 60 seconds
- **Reason**: AI generation can take time for long texts
- **Fallback**: Return timeout error if exceeded

### Asynchronous Processing (Future)
- For MVP: Synchronous processing (wait for AI response)
- Module 3+: Consider background job processing
  - User submits request
  - Returns job ID immediately
  - Poll for completion
  - Notification when ready

### Caching (Future)
- **Hash-based cache**: If source_text_hash exists
  - Check if recent generation exists (< 24 hours)
  - Return cached proposals
  - Save API costs

### Monitoring
- Track generation duration (avg, p50, p95, p99)
- Monitor error rates by error code
- Alert on unusual patterns

---

## 9. Implementation Steps

### Step 1: Install Dependencies

```bash
npm install zod  # For validation
```

### Step 2: Create Validation Schema
**File**: `src/lib/validators/generation.validator.ts`

```typescript
import { z } from 'zod';

export const generateFlashcardsSchema = z.object({
  source_text: z.string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must be 10000 characters or less")
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

### Step 3: Create OpenRouter Service
**File**: `src/lib/services/openrouter.service.ts`

```typescript
interface FlashcardProposal {
  front: string;
  back: string;
}

export class OpenRouterService {
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey: string;
  private model = 'openai/gpt-4o-mini';

  constructor() {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    this.apiKey = apiKey;
  }

  async generateFlashcards(sourceText: string): Promise<FlashcardProposal[]> {
    const prompt = this.buildPrompt(sourceText);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://10xcards.app',
        'X-Title': '10xCards',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: HTTP ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenRouter API');
    }

    return this.parseResponse(content);
  }

  private buildPrompt(sourceText: string): string {
    return `Generate flashcards from the following text. Create 3-5 high-quality flashcards.

Requirements:
- Each flashcard must have a "front" (question) and "back" (answer)
- Front text must be 200 characters or less
- Back text must be 500 characters or less
- Focus on key concepts, definitions, and important facts
- Make questions clear and specific
- Provide comprehensive but concise answers

Return ONLY a valid JSON array with this exact structure:
[
  {"front": "question here", "back": "answer here"},
  {"front": "question here", "back": "answer here"}
]

Source text:
${sourceText}`;
  }

  private parseResponse(content: string): FlashcardProposal[] {
    // Remove markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }

    const proposals = JSON.parse(jsonContent);

    if (!Array.isArray(proposals) || proposals.length === 0) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and truncate
    return proposals.map((p) => ({
      front: p.front.substring(0, 200),
      back: p.back.substring(0, 500),
    }));
  }
}
```

### Step 4: Create Generation Service
**File**: `src/lib/services/generation.service.ts`

```typescript
import { getServiceSupabase } from '../supabase';
import { hashSourceText } from '../utils';
import { OpenRouterService } from './openrouter.service';
import type { TablesInsert } from '../../db/types';

export class GenerationService {
  private supabase = getServiceSupabase();
  private openRouterService = new OpenRouterService();

  async generateFlashcards(sourceText: string, userId: string) {
    const startTime = Date.now();

    // Hash source text
    const sourceTextHash = hashSourceText(sourceText);
    const sourceTextLength = sourceText.length;

    try {
      // Call AI service
      const proposals = await this.openRouterService.generateFlashcards(sourceText);

      // Calculate duration
      const generationDuration = Date.now() - startTime;

      // Create generation record
      const generationData: TablesInsert<'generations'> = {
        user_id: userId,
        model: 'openai/gpt-4o-mini',
        generated_count: proposals.length,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        generation_duration: generationDuration,
      };

      const { data: generation, error } = await this.supabase
        .from('generations')
        .insert(generationData)
        .select()
        .single();

      if (error || !generation) {
        throw new Error(`Failed to create generation record: ${error?.message}`);
      }

      return {
        generation_id: generation.id,
        flashcards_proposals: proposals.map(p => ({
          ...p,
          source: 'ai-full' as const,
        })),
        generated_count: proposals.length,
        generation_duration: generationDuration,
        model: 'openai/gpt-4o-mini',
      };
    } catch (error) {
      // Log error to database
      await this.logError(
        userId,
        sourceTextHash,
        sourceTextLength,
        error
      );

      throw error;
    }
  }

  private async logError(
    userId: string,
    sourceTextHash: string,
    sourceTextLength: number,
    error: unknown
  ) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.extractErrorCode(errorMessage);

    const errorLog: TablesInsert<'generation_error_logs'> = {
      user_id: userId,
      model: 'openai/gpt-4o-mini',
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: errorCode,
      error_message: errorMessage.substring(0, 1000),
    };

    await this.supabase.from('generation_error_logs').insert(errorLog);
  }

  private extractErrorCode(errorMessage: string): string {
    if (errorMessage.includes('timeout')) return 'API_TIMEOUT';
    if (errorMessage.includes('rate limit')) return 'API_RATE_LIMIT';
    if (errorMessage.includes('HTTP 4')) return 'HTTP_4XX';
    if (errorMessage.includes('HTTP 5')) return 'HTTP_5XX';
    if (errorMessage.includes('JSON')) return 'INVALID_JSON';
    if (errorMessage.includes('Empty response')) return 'EMPTY_RESPONSE';
    return 'UNKNOWN_ERROR';
  }
}
```

### Step 5: Create API Endpoint
**File**: `src/pages/api/generations/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { generateFlashcardsSchema } from '../../../lib/validators/generation.validator';
import { GenerationService } from '../../../lib/services/generation.service';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const validation = generateFlashcardsSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: errors.source_text?.[0] || 'Invalid source_text',
          details: {
            source_text_length: body.source_text?.length || 0,
            min_length: 1000,
            max_length: 10000,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID (MVP: hardcoded, Module 3: from auth)
    const userId = '00000000-0000-0000-0000-000000000001';

    // Generate flashcards
    const generationService = new GenerationService();
    const result = await generationService.generateFlashcards(
      validation.data.source_text,
      userId
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to generate flashcards',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Step 6: Testing
1. **Unit tests**: Test OpenRouterService parsing
2. **Integration tests**: Test GenerationService
3. **Manual tests**: Use curl with 1000+ character text
4. **Error tests**: Test with invalid API key, timeout, etc.

---

## 10. Testing Examples

### Test Case 1: Valid Generation

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "TypeScript is a strongly typed programming language that builds on JavaScript... [1000+ characters]"
  }'
```

### Test Case 2: Too Short

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Short text"
  }'
```

Expected: 400 error

### Test Case 3: Missing API Key

Remove `OPENROUTER_API_KEY` from `.env` and test.

Expected: 500 error

---

## 11. Future Enhancements (Module 3+)

### Background Processing
- Queue generation requests
- Return job ID immediately
- Poll for status
- WebSocket for real-time updates

### Caching
- Cache by source_text_hash
- TTL: 24 hours
- Save API costs

### Advanced AI Features
- Custom number of flashcards (user preference)
- Difficulty levels
- Topic/category detection
- Multi-language support

### Analytics
- Track most common source_text_length
- Monitor generation success rate
- Identify optimal prompt variations

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Status**: Ready for Implementation
**Dependencies**: OpenRouter API key, validation, services
**Next Steps**: Implement services and endpoint, test with real API
