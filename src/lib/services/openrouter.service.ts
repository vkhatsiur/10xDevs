import type {
  FlashcardProposal,
  ModelParameters,
  OpenRouterConfig,
  RequestPayload,
  ApiResponse,
} from '../types/openrouter.types';
import { HttpError, ApiTimeoutError, InvalidResponseError } from '../errors/openrouter.errors';

export class OpenRouterService {
  private apiUrl: string;
  private apiKey: string;
  private model: string;
  private timeout: number;
  private maxRetries: number;
  private currentModelParameters: ModelParameters;
  private retryDelay: number = 1000;

  constructor(config?: OpenRouterConfig) {
    this.apiUrl = config?.apiUrl || 'https://openrouter.ai/api/v1/chat/completions';
    this.model = config?.model || 'openai/gpt-4o-mini';
    this.timeout = config?.timeout || 60000; // 60 seconds
    this.maxRetries = config?.maxRetries || 2;

    // Get API key from config or environment
    const apiKey = config?.apiKey || import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    this.apiKey = apiKey;
    this.currentModelParameters = {
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0,
      presence_penalty: 0,
    };
  }

  /**
   * Generate flashcard proposals from source text
   */
  async generateFlashcards(sourceText: string): Promise<FlashcardProposal[]> {
    const prompt = this.buildPrompt(sourceText);
    const payload = this.buildRequestPayload(prompt);
    const apiResponse = await this.executeRequest(payload);
    return this.parseResponse(apiResponse);
  }

  /**
   * Set model and its parameters
   */
  setModel(modelName: string, parameters?: ModelParameters): void {
    this.model = modelName;
    if (parameters) {
      this.currentModelParameters = { ...this.currentModelParameters, ...parameters };
    }
  }

  /**
   * Set request timeout
   */
  setTimeout(milliseconds: number): void {
    this.timeout = milliseconds;
  }

  /**
   * Set maximum retry attempts
   */
  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenRouterConfig {
    return {
      apiUrl: this.apiUrl,
      model: this.model,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
    };
  }

  /**
   * Build prompt for flashcard generation
   */
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

  /**
   * Build API request payload
   */
  private buildRequestPayload(prompt: string): RequestPayload {
    return {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: this.currentModelParameters.temperature,
      top_p: this.currentModelParameters.top_p,
      frequency_penalty: this.currentModelParameters.frequency_penalty,
      presence_penalty: this.currentModelParameters.presence_penalty,
      max_tokens: this.currentModelParameters.max_tokens,
    };
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest(payload: RequestPayload, attempt: number = 1): Promise<ApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://10xcards.app',
          'X-Title': '10xCards',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpError(response.status, errorText);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiTimeoutError(this.timeout);
      }

      // Retry logic
      if (attempt < this.maxRetries && this.shouldRetry(error)) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await this.sleep(delay);
        return this.executeRequest(payload, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Determine if error is retryable
   */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof HttpError) {
      // Retry on 5xx server errors and 429 rate limit
      return error.status >= 500 || error.status === 429;
    }

    if (error instanceof Error) {
      // Retry on network errors
      return error.message.includes('network') || error.message.includes('ECONNREFUSED');
    }

    return false;
  }

  /**
   * Parse and validate AI response
   */
  private parseResponse(apiResponse: ApiResponse): FlashcardProposal[] {
    const content = apiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new InvalidResponseError('Empty response from OpenRouter API');
    }

    // Remove markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }

    // Parse JSON
    let proposals: FlashcardProposal[];
    try {
      proposals = JSON.parse(jsonContent);
    } catch {
      throw new InvalidResponseError(
        `Failed to parse AI response as JSON`,
        jsonContent.substring(0, 200)
      );
    }

    // Validate structure
    if (!Array.isArray(proposals) || proposals.length === 0) {
      throw new InvalidResponseError(
        'Invalid response format: expected non-empty array',
        jsonContent
      );
    }

    // Validate and transform proposals
    return proposals.map((p, index) => {
      if (!p.front || !p.back) {
        throw new InvalidResponseError(
          `Invalid proposal at index ${index}: missing front or back`,
          JSON.stringify(p)
        );
      }

      return {
        front: String(p.front).substring(0, 200),
        back: String(p.back).substring(0, 500),
      };
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
