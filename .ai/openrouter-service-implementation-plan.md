# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service integrates communication with LLM models via the OpenRouter API. The main goal of this service is to enable automatic generation of flashcards based on a combination of system and user messages, while processing structured responses in JSON format.

**Key Responsibilities**:
- Send requests to OpenRouter API
- Configure model parameters (temperature, top_p, etc.)
- Build proper prompt for flashcard generation
- Parse and validate AI responses
- Handle errors and retries

---

## 2. Constructor Description

The constructor should:
- Initialize API configuration (API key, base URL)
- Set default model parameters (temperature, top_p, frequency_penalty, presence_penalty)
- Allow configuration of system message (role: 'system') and user message (role: 'user')
- Accept optional initialization parameters (timeout, retries)

```typescript
constructor(config?: OpenRouterConfig) {
  this.apiUrl = config?.apiUrl || 'https://openrouter.ai/api/v1/chat/completions';
  this.apiKey = config?.apiKey || import.meta.env.OPENROUTER_API_KEY;
  this.model = config?.model || 'openai/gpt-4o-mini';
  this.timeout = config?.timeout || 60000; // 60 seconds
  this.maxRetries = config?.maxRetries || 2;

  if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
}
```

---

## 3. Public Methods and Fields

### Main Public Interface

#### `generateFlashcards(sourceText: string): Promise<FlashcardProposal[]>`
**Purpose**: Generate flashcard proposals from source text

**Parameters**:
- `sourceText` (string): Text to generate flashcards from

**Returns**: Promise<FlashcardProposal[]>

**Behavior**:
- Builds appropriate prompt
- Calls OpenRouter API
- Parses JSON response
- Validates proposals
- Returns array of flashcard proposals

**Example**:
```typescript
const service = new OpenRouterService();
const proposals = await service.generateFlashcards(longText);
// Returns: [{ front: "...", back: "..." }, ...]
```

---

#### `setModel(modelName: string, parameters?: ModelParameters): void`
**Purpose**: Configure which model to use and its parameters

**Parameters**:
- `modelName` (string): Model identifier (e.g., 'openai/gpt-4o-mini')
- `parameters` (optional): Model-specific parameters

```typescript
interface ModelParameters {
  temperature?: number;        // 0-2, default 0.7
  top_p?: number;             // 0-1, default 1
  frequency_penalty?: number;  // -2 to 2, default 0
  presence_penalty?: number;   // -2 to 2, default 0
  max_tokens?: number;        // Max tokens in response
}

setModel('openai/gpt-4o-mini', {
  temperature: 0.7,
  top_p: 1.0,
});
```

---

#### `setTimeout(milliseconds: number): void`
**Purpose**: Set request timeout

**Parameters**:
- `milliseconds` (number): Timeout in milliseconds

```typescript
service.setTimeout(30000); // 30 seconds
```

---

#### `setMaxRetries(retries: number): void`
**Purpose**: Configure retry behavior

**Parameters**:
- `retries` (number): Maximum number of retry attempts

```typescript
service.setMaxRetries(3); // Retry up to 3 times
```

---

### Public Configuration Fields

```typescript
class OpenRouterService {
  // Configuration
  public readonly apiUrl: string;
  public readonly model: string;
  public readonly timeout: number;
  public readonly maxRetries: number;

  // Read-only access to current configuration
  public getConfig(): OpenRouterConfig {
    return {
      apiUrl: this.apiUrl,
      model: this.model,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
    };
  }
}
```

---

## 4. Private Methods and Fields

### Private Configuration Fields

```typescript
private apiKey: string;
private currentModelParameters: ModelParameters;
private retryDelay: number = 1000; // Initial retry delay (ms)
```

---

### `private buildPrompt(sourceText: string): string`
**Purpose**: Build the prompt for flashcard generation

**Parameters**:
- `sourceText` (string): User's source text

**Returns**: string (formatted prompt)

**Implementation**:
```typescript
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
```

---

### `private buildRequestPayload(prompt: string): RequestPayload`
**Purpose**: Build the API request payload

**Implementation**:
```typescript
private buildRequestPayload(prompt: string): RequestPayload {
  return {
    model: this.model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: this.currentModelParameters.temperature || 0.7,
    top_p: this.currentModelParameters.top_p || 1.0,
    frequency_penalty: this.currentModelParameters.frequency_penalty || 0,
    presence_penalty: this.currentModelParameters.presence_penalty || 0,
    max_tokens: this.currentModelParameters.max_tokens,
  };
}
```

---

### `private async executeRequest(payload: RequestPayload, attempt: number = 1): Promise<ApiResponse>`
**Purpose**: Execute HTTP request with retry logic

**Parameters**:
- `payload` (RequestPayload): Request body
- `attempt` (number): Current attempt number

**Returns**: Promise<ApiResponse>

**Implementation**:
```typescript
private async executeRequest(
  payload: RequestPayload,
  attempt: number = 1
): Promise<ApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.timeout);

  try {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://10xcards.app',
        'X-Title': '10xCards',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new HttpError(response.status, await response.text());
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry logic
    if (attempt < this.maxRetries && this.shouldRetry(error)) {
      const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
      await this.sleep(delay);
      return this.executeRequest(payload, attempt + 1);
    }

    throw error;
  }
}
```

---

### `private shouldRetry(error: unknown): boolean`
**Purpose**: Determine if error is retryable

**Implementation**:
```typescript
private shouldRetry(error: unknown): boolean {
  if (error instanceof HttpError) {
    // Retry on 5xx server errors and 429 rate limit
    return error.status >= 500 || error.status === 429;
  }

  if (error instanceof Error) {
    // Retry on network errors, but not on timeout
    return error.message.includes('network') || error.message.includes('ECONNREFUSED');
  }

  return false;
}
```

---

### `private parseResponse(apiResponse: ApiResponse): FlashcardProposal[]`
**Purpose**: Parse and validate AI response

**Implementation**:
```typescript
private parseResponse(apiResponse: ApiResponse): FlashcardProposal[] {
  const content = apiResponse.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenRouter API');
  }

  // Remove markdown code blocks if present
  let jsonContent = content.trim();
  if (jsonContent.startsWith('```json')) {
    jsonContent = jsonContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '');
  } else if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/```\n?/g, '');
  }

  // Parse JSON
  let proposals: any[];
  try {
    proposals = JSON.parse(jsonContent);
  } catch (error) {
    throw new Error(`Failed to parse AI response as JSON: ${jsonContent.substring(0, 200)}`);
  }

  // Validate structure
  if (!Array.isArray(proposals) || proposals.length === 0) {
    throw new Error('Invalid response format: expected non-empty array');
  }

  // Validate and transform proposals
  return proposals.map((p, index) => {
    if (!p.front || !p.back) {
      throw new Error(`Invalid proposal at index ${index}: missing front or back`);
    }

    return {
      front: String(p.front).substring(0, 200),
      back: String(p.back).substring(0, 500),
    };
  });
}
```

---

### `private sleep(ms: number): Promise<void>`
**Purpose**: Sleep utility for retry delays

```typescript
private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 5. Error Handling

### Custom Error Classes

```typescript
class HttpError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`HTTP ${status}: ${body}`);
    this.name = 'HttpError';
  }
}

class ApiTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'ApiTimeoutError';
  }
}

class InvalidResponseError extends Error {
  constructor(message: string, public response?: string) {
    super(message);
    this.name = 'InvalidResponseError';
  }
}
```

### Error Handling Strategy

```typescript
try {
  const proposals = await service.generateFlashcards(sourceText);
} catch (error) {
  if (error instanceof HttpError) {
    if (error.status === 401) {
      // Invalid API key
      console.error('Authentication failed: Check OPENROUTER_API_KEY');
    } else if (error.status === 429) {
      // Rate limit
      console.error('Rate limit exceeded: Try again later');
    } else if (error.status >= 500) {
      // Server error
      console.error('OpenRouter server error: Try again later');
    }
  } else if (error instanceof ApiTimeoutError) {
    console.error('Request timeout: Text may be too long or API is slow');
  } else if (error instanceof InvalidResponseError) {
    console.error('Failed to parse AI response:', error.response);
  } else {
    console.error('Unexpected error:', error);
  }

  throw error; // Re-throw for higher-level handling
}
```

### Error Logging

```typescript
private logError(error: unknown, context: Record<string, any>): void {
  console.error('OpenRouterService Error:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 6. Security Considerations

### API Key Management
- **Storage**: Store API key in environment variables
- **Access**: Never expose API key in client-side code
- **Validation**: Check API key exists and is valid on initialization
- **Rotation**: Support easy key rotation

```typescript
constructor() {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  if (apiKey === 'your_openrouter_api_key_here') {
    throw new Error('Please set a valid OPENROUTER_API_KEY');
  }

  this.apiKey = apiKey;
}
```

### Data Privacy
- **No logging of sensitive data**: Don't log full source text or API keys
- **Truncate logs**: If logging responses, truncate to reasonable length
- **Secure transmission**: Always use HTTPS (OpenRouter API is HTTPS)

### Input Validation
- Validate source text length before sending to API
- Sanitize source text to prevent prompt injection
- Validate AI responses before returning

---

## 7. Step-by-Step Implementation Plan

### Step 1: Project Setup
1. Verify dependencies are installed (Astro, TypeScript)
2. Review OpenRouter API documentation
3. Obtain API key from https://openrouter.ai/keys
4. Add API key to `.env` file

---

### Step 2: Create Type Definitions
**File**: `src/lib/types/openrouter.types.ts`

```typescript
export interface FlashcardProposal {
  front: string;
  back: string;
}

export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

export interface OpenRouterConfig {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface RequestPayload {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

export interface ApiResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

### Step 3: Create Error Classes
**File**: `src/lib/errors/openrouter.errors.ts`

```typescript
export class HttpError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`HTTP ${status}: ${body}`);
    this.name = 'HttpError';
  }
}

export class ApiTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'ApiTimeoutError';
  }
}

export class InvalidResponseError extends Error {
  constructor(message: string, public response?: string) {
    super(message);
    this.name = 'InvalidResponseError';
  }
}
```

---

### Step 4: Implement OpenRouter Service
**File**: `src/lib/services/openrouter.service.ts`

Implement all methods described in sections 3 and 4.

---

### Step 5: Create Unit Tests
**File**: `src/lib/services/__tests__/openrouter.service.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { OpenRouterService } from '../openrouter.service';

describe('OpenRouterService', () => {
  it('should parse valid JSON response', () => {
    // Test parseResponse with valid JSON
  });

  it('should handle markdown code blocks', () => {
    // Test parseResponse with ```json blocks
  });

  it('should truncate long proposals', () => {
    // Test that front/back are truncated to limits
  });

  it('should throw on invalid JSON', () => {
    // Test error handling for invalid JSON
  });

  it('should retry on 5xx errors', () => {
    // Test retry logic
  });

  it('should not retry on 4xx errors', () => {
    // Test that client errors don't retry
  });
});
```

---

### Step 6: Integration Testing
1. Test with real OpenRouter API
2. Verify response format
3. Test error scenarios (invalid key, timeout)
4. Measure performance (generation time)

---

### Step 7: Documentation
1. Add JSDoc comments to all public methods
2. Create usage examples
3. Document error handling
4. Add troubleshooting guide

---

## 8. Usage Examples

### Basic Usage

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';

const service = new OpenRouterService();

try {
  const proposals = await service.generateFlashcards(longText);
  console.log(`Generated ${proposals.length} flashcard proposals`);

  proposals.forEach((proposal, index) => {
    console.log(`\nFlashcard ${index + 1}:`);
    console.log(`Q: ${proposal.front}`);
    console.log(`A: ${proposal.back}`);
  });
} catch (error) {
  console.error('Failed to generate flashcards:', error);
}
```

### Advanced Configuration

```typescript
const service = new OpenRouterService({
  model: 'openai/gpt-4o-mini',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
});

service.setModel('openai/gpt-4o-mini', {
  temperature: 0.8, // More creative
  top_p: 0.9,
  max_tokens: 2000,
});

const proposals = await service.generateFlashcards(sourceText);
```

### Error Handling

```typescript
import { HttpError, ApiTimeoutError } from './lib/errors/openrouter.errors';

try {
  const proposals = await service.generateFlashcards(sourceText);
} catch (error) {
  if (error instanceof HttpError) {
    if (error.status === 429) {
      // Rate limit - implement backoff
      await sleep(60000); // Wait 1 minute
      return retry();
    } else if (error.status >= 500) {
      // Server error - log and notify
      logToMonitoring(error);
      notifyAdmin(error);
    }
  } else if (error instanceof ApiTimeoutError) {
    // Timeout - maybe text is too long
    console.warn('Generation timeout - try shorter text');
  }

  throw error;
}
```

---

## 9. Performance Optimization

### Caching (Future)
```typescript
private cache = new Map<string, { proposals: FlashcardProposal[], timestamp: number }>();
private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

async generateFlashcards(sourceText: string): Promise<FlashcardProposal[]> {
  const hash = hashSourceText(sourceText);
  const cached = this.cache.get(hash);

  if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
    return cached.proposals;
  }

  const proposals = await this.fetchFromAPI(sourceText);
  this.cache.set(hash, { proposals, timestamp: Date.now() });

  return proposals;
}
```

### Request Deduplication
```typescript
private inFlightRequests = new Map<string, Promise<FlashcardProposal[]>>();

async generateFlashcards(sourceText: string): Promise<FlashcardProposal[]> {
  const hash = hashSourceText(sourceText);

  if (this.inFlightRequests.has(hash)) {
    return this.inFlightRequests.get(hash)!;
  }

  const promise = this.fetchFromAPI(sourceText);
  this.inFlightRequests.set(hash, promise);

  try {
    return await promise;
  } finally {
    this.inFlightRequests.delete(hash);
  }
}
```

---

## 10. Monitoring and Observability

### Metrics to Track
- Request count (total, success, failure)
- Response time (avg, p50, p95, p99)
- Error rate by error type
- Token usage
- Cost per request

### Logging
```typescript
private logRequest(payload: RequestPayload, duration: number, success: boolean): void {
  console.log({
    event: 'openrouter_request',
    model: payload.model,
    duration_ms: duration,
    success,
    timestamp: new Date().toISOString(),
  });
}
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Status**: Ready for Implementation
**Dependencies**: OpenRouter API key, fetch API, environment configuration
**Next Steps**: Implement service, create tests, integrate with GenerationService
