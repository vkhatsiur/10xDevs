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
