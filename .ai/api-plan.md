# REST API Plan - 10xCards

## Overview

This document defines the REST API structure for 10xCards MVP. The API follows RESTful principles and uses Supabase for authentication and data persistence.

## 1. Resources

### Users
- **Database Table**: `users`
- **Management**: Handled through Supabase Auth
- **Operations**: Registration and login managed via Supabase Auth (Module 3)

### Flashcards
- **Database Table**: `flashcards`
- **Fields**: `id`, `front`, `back`, `source`, `created_at`, `updated_at`, `generation_id`, `user_id`
- **Description**: Individual flashcards (AI-generated or manually created)

### Generations
- **Database Table**: `generations`
- **Fields**: `id`, `user_id`, `model`, `generated_count`, `accepted_unedited_count`, `accepted_edited_count`, `source_text_hash`, `source_text_length`, `generation_duration`, `created_at`, `updated_at`
- **Description**: Metadata and results of AI generation requests

### Generation Error Logs
- **Database Table**: `generation_error_logs`
- **Fields**: `id`, `user_id`, `model`, `source_text_hash`, `source_text_length`, `error_code`, `error_message`, `created_at`
- **Description**: Error logging for failed AI generations

---

## 2. API Endpoints

### 2.1. Authentication (Module 3)

**Note**: For MVP, we use a hardcoded test user. Full authentication will be implemented in Module 3.

- **POST `/auth/register`** - User registration (Module 3)
- **POST `/auth/login`** - User login (Module 3)
- **POST `/auth/logout`** - User logout (Module 3)

---

### 2.2. Flashcards

#### GET `/api/flashcards`
**Description**: Retrieve all flashcards for the authenticated user

**Query Parameters**:
- `page` (default: 1) - Page number for pagination
- `limit` (default: 10) - Number of items per page
- `sort` (default: `created_at`) - Field to sort by
- `order` (default: `desc`) - Sort order (`asc` or `desc`)
- `source` (optional) - Filter by source (`ai-full`, `ai-edited`, `manual`)
- `generation_id` (optional) - Filter by generation ID

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript",
      "source": "manual",
      "created_at": "2025-11-17T10:00:00Z",
      "updated_at": "2025-11-17T10:00:00Z",
      "generation_id": null,
      "user_id": "00000000-0000-0000-0000-000000000001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

**Errors**:
- `401 Unauthorized` - Invalid or missing authentication token

---

#### GET `/api/flashcards/{id}`
**Description**: Retrieve a specific flashcard by ID

**Response** (200 OK):
```json
{
  "id": 1,
  "front": "What is TypeScript?",
  "back": "A typed superset of JavaScript",
  "source": "manual",
  "created_at": "2025-11-17T10:00:00Z",
  "updated_at": "2025-11-17T10:00:00Z",
  "generation_id": null,
  "user_id": "00000000-0000-0000-0000-000000000001"
}
```

**Errors**:
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Flashcard not found

---

#### POST `/api/flashcards`
**Description**: Create one or more flashcards (manually or from AI generation proposals)

**Request Body**:
```json
{
  "flashcards": [
    {
      "front": "Question 1",
      "back": "Answer 1",
      "source": "manual",
      "generation_id": null
    },
    {
      "front": "Question 2",
      "back": "Answer 2",
      "source": "ai-full",
      "generation_id": 123
    }
  ]
}
```

**Validation Rules**:
- `front`: Required, maximum 200 characters
- `back`: Required, maximum 500 characters
- `source`: Required, must be one of: `ai-full`, `ai-edited`, `manual`
- `generation_id`:
  - Required for `ai-full` and `ai-edited` sources
  - Must be `null` for `manual` source

**Response** (201 Created):
```json
{
  "flashcards": [
    {
      "id": 1,
      "front": "Question 1",
      "back": "Answer 1",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-11-17T10:00:00Z",
      "updated_at": "2025-11-17T10:00:00Z",
      "user_id": "00000000-0000-0000-0000-000000000001"
    },
    {
      "id": 2,
      "front": "Question 2",
      "back": "Answer 2",
      "source": "ai-full",
      "generation_id": 123,
      "created_at": "2025-11-17T10:00:00Z",
      "updated_at": "2025-11-17T10:00:00Z",
      "user_id": "00000000-0000-0000-0000-000000000001"
    }
  ]
}
```

**Errors**:
- `400 Bad Request` - Validation errors (invalid length, source, or generation_id)
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Generation ID not found (for AI sources)

---

#### PUT `/api/flashcards/{id}`
**Description**: Update an existing flashcard

**Request Body**:
```json
{
  "front": "Updated question",
  "back": "Updated answer"
}
```

**Business Logic**:
- If flashcard source is `ai-full` and user edits it, change source to `ai-edited`
- Update `updated_at` timestamp automatically (database trigger)

**Response** (200 OK):
```json
{
  "id": 1,
  "front": "Updated question",
  "back": "Updated answer",
  "source": "ai-edited",
  "created_at": "2025-11-17T10:00:00Z",
  "updated_at": "2025-11-17T11:00:00Z",
  "generation_id": 123,
  "user_id": "00000000-0000-0000-0000-000000000001"
}
```

**Errors**:
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Flashcard not found

---

#### DELETE `/api/flashcards/{id}`
**Description**: Delete a flashcard

**Response** (200 OK):
```json
{
  "message": "Flashcard deleted successfully"
}
```

**Errors**:
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Flashcard not found

---

### 2.3. Generations

#### POST `/api/generations`
**Description**: Initiate AI generation process to create flashcard proposals

**Important**: This endpoint **does NOT save flashcards** to the database. It only returns proposals. The user must then accept proposals and save them via `POST /api/flashcards`.

**Request Body**:
```json
{
  "source_text": "User provided text (1000 to 10000 characters)"
}
```

**Validation Rules**:
- `source_text`: Required, minimum 1000 characters, maximum 10000 characters

**Business Logic**:
1. Validate `source_text` length
2. Hash source text (SHA-256) for privacy and duplicate detection
3. Call AI service (OpenRouter) to generate flashcard proposals
4. Create generation record with metadata
5. Return proposals to user (NOT saved to flashcards table yet)

**Response** (201 Created):
```json
{
  "generation_id": 123,
  "flashcards_proposals": [
    {
      "front": "Generated Question 1",
      "back": "Generated Answer 1",
      "source": "ai-full"
    },
    {
      "front": "Generated Question 2",
      "back": "Generated Answer 2",
      "source": "ai-full"
    }
  ],
  "generated_count": 5,
  "generation_duration": 3500,
  "model": "openai/gpt-4o-mini"
}
```

**Errors**:
- `400 Bad Request` - Invalid source text (length out of range)
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - AI service error (logged in `generation_error_logs`)

**Error Logging**:
- All AI service errors are logged to `generation_error_logs` table
- Includes: error code, error message, model, source_text_hash, source_text_length

---

#### GET `/api/generations`
**Description**: Retrieve list of generation requests for authenticated user

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "model": "openai/gpt-4o-mini",
      "generated_count": 5,
      "accepted_unedited_count": 3,
      "accepted_edited_count": 1,
      "source_text_hash": "abc123...",
      "source_text_length": 2500,
      "generation_duration": 3500,
      "created_at": "2025-11-17T10:00:00Z",
      "updated_at": "2025-11-17T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

**Errors**:
- `401 Unauthorized` - Invalid or missing authentication token

---

#### GET `/api/generations/{id}`
**Description**: Retrieve detailed information about a specific generation

**Response** (200 OK):
```json
{
  "id": 123,
  "model": "openai/gpt-4o-mini",
  "generated_count": 5,
  "accepted_unedited_count": 3,
  "accepted_edited_count": 1,
  "source_text_hash": "abc123...",
  "source_text_length": 2500,
  "generation_duration": 3500,
  "created_at": "2025-11-17T10:00:00Z",
  "updated_at": "2025-11-17T10:00:00Z",
  "flashcards": [
    {
      "id": 10,
      "front": "Question",
      "back": "Answer",
      "source": "ai-full",
      "generation_id": 123
    }
  ]
}
```

**Errors**:
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Generation not found

---

### 2.4. Generation Error Logs

**Note**: This endpoint is typically for admin/debugging purposes.

#### GET `/api/generation-error-logs`
**Description**: Retrieve error logs for AI flashcard generation

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "model": "openai/gpt-4o-mini",
      "source_text_hash": "abc123...",
      "source_text_length": 2500,
      "error_code": "API_TIMEOUT",
      "error_message": "Request timeout after 60 seconds",
      "created_at": "2025-11-17T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

**Errors**:
- `401 Unauthorized` - Invalid or missing authentication token
- `403 Forbidden` - Insufficient permissions (admin only)

---

## 3. Authentication and Authorization

### Mechanism
- **Token-based authentication** using Supabase Auth
- Users authenticate via `/auth/login` or `/auth/register`
- Receive a bearer token for subsequent requests

### Process
1. User registers or logs in via Supabase Auth
2. Receives JWT token
3. Includes token in `Authorization` header: `Bearer <token>`
4. Protected endpoints verify token
5. Database Row-Level Security (RLS) ensures users access only their own data

### MVP Simplification
- For MVP (Module 2), we use a **hardcoded test user ID**
- Full authentication implemented in **Module 3**
- RLS policies enabled in **Module 3**

### Security Considerations
- Use HTTPS in production
- Implement rate limiting (Module 3)
- Secure error messages (don't expose internal details)
- Validate all inputs
- Use parameterized queries (SQL injection prevention)

---

## 4. Validation and Business Logic

### Validation Rules

#### Flashcards
- `front`: Maximum 200 characters
- `back`: Maximum 500 characters
- `source`: Must be one of: `ai-full`, `ai-edited`, `manual`
- `generation_id`: Required for AI sources, null for manual

#### Generations
- `source_text`: 1000-10000 characters
- `source_text_hash`: SHA-256 hash (computed automatically)

### Business Logic

#### AI Generation Flow
1. User submits source text via `POST /api/generations`
2. System validates input (1000-10000 chars)
3. System hashes source text (privacy)
4. System calls AI service (OpenRouter)
5. System creates generation record
6. System returns **proposals** (not saved to flashcards yet)
7. User reviews proposals in UI
8. User accepts selected flashcards
9. User saves accepted flashcards via `POST /api/flashcards`

#### Flashcard Management
- Creating flashcard: Set user_id, validate inputs
- Updating flashcard: If source is `ai-full` and edited, change to `ai-edited`
- Deleting flashcard: Cascade delete handled by database
- `updated_at` automatically updated via database trigger

#### Generation Statistics
- `generated_count`: Set when generation created
- `accepted_unedited_count`: Updated when user saves `ai-full` flashcards
- `accepted_edited_count`: Updated when user edits and saves flashcards

---

## 5. Error Handling

### Standard Error Response Format
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### HTTP Status Codes
- `200 OK` - Successful GET/PUT/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation errors, invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server or service errors

### Error Logging
- Log all errors server-side
- Include timestamp, user_id, endpoint, error details
- For AI errors, log to `generation_error_logs` table
- Never expose sensitive information in error responses

---

## 6. Performance Considerations

### Database
- Indexes on foreign keys (`user_id`, `generation_id`)
- Indexes on commonly queried fields (`created_at`)
- Pagination for large result sets
- Efficient batch operations for multiple flashcards

### API
- Batch insert for multiple flashcards (single query)
- Caching strategies (Module 3)
- Connection pooling (handled by Supabase)

### AI Service
- Timeout: 60 seconds
- Retry logic with exponential backoff
- Asynchronous processing for large requests (future)

---

## 7. API Versioning

### Current Version
- Version: v1 (implicit)
- Base URL: `/api`

### Future Versioning Strategy
- URL-based versioning: `/api/v2/...`
- Maintain backward compatibility
- Deprecation warnings for old versions

---

## 8. Rate Limiting (Module 3)

### Limits
- **Anonymous**: Not allowed
- **Authenticated**: 100 requests/minute
- **AI Generation**: 10 requests/hour

### Headers
- `X-RateLimit-Limit`: Total allowed requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Timestamp when limit resets

---

## 9. Testing Strategy

### Unit Tests
- Test validation functions
- Test business logic in services
- Mock database and AI service calls

### Integration Tests
- Test complete API flows
- Test authentication and authorization
- Test error handling

### Manual Testing (MVP)
- Use curl or Postman
- Verify Supabase database records
- Check error logging

---

## 10. Implementation Phases

### Phase 1: Core Infrastructure (✅ Done)
- Database schema and migrations
- Supabase client setup
- Environment configuration
- TypeScript types generation

### Phase 2: Flashcards API (Current)
- GET /api/flashcards (list)
- GET /api/flashcards/{id} (single)
- POST /api/flashcards (create)
- PUT /api/flashcards/{id} (update)
- DELETE /api/flashcards/{id} (delete)

### Phase 3: Generations API (Current)
- POST /api/generations (create proposals)
- GET /api/generations (list)
- GET /api/generations/{id} (single)
- OpenRouter service integration

### Phase 4: Frontend Integration (Next)
- React components
- API client hooks
- Error handling UI
- Loading states

### Phase 5: Authentication (Module 3)
- Supabase Auth integration
- Protected routes
- RLS policies
- User session management

---

## 11. API Client Example (Frontend)

```typescript
// Example usage from React component

// Create flashcards from proposals
const saveFlashcards = async (proposals: FlashcardProposal[], generationId: number) => {
  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Module 3
    },
    body: JSON.stringify({
      flashcards: proposals.map(p => ({
        front: p.front,
        back: p.back,
        source: 'ai-full',
        generation_id: generationId
      }))
    })
  });

  return await response.json();
};

// Generate flashcard proposals
const generateProposals = async (sourceText: string) => {
  const response = await fetch('/api/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Module 3
    },
    body: JSON.stringify({ source_text: sourceText })
  });

  return await response.json();
};
```

---

## 12. Documentation

### API Documentation Tools
- OpenAPI/Swagger specification (future)
- Postman collection (future)
- Interactive API explorer (future)

### Current Documentation
- This document (api-plan.md)
- Implementation plans for specific endpoints
- Database schema documentation (db-plan.md)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Status**: In Progress (Phase 2-3)
**Next Steps**: Complete generations endpoint, implement frontend integration
