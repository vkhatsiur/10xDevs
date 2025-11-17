#!/bin/bash

# Test API endpoints for 10xCards

echo "=========================================="
echo "Testing 10xCards API Endpoints"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:4321/api"

# Test 1: GET /api/flashcards (should be empty initially)
echo -e "${YELLOW}Test 1: GET /api/flashcards${NC}"
echo "Expected: Empty list or existing flashcards"
curl -s -X GET "$BASE_URL/flashcards" | json_pp
echo ""
echo "---"
echo ""

# Test 2: POST /api/generations (generate proposals)
echo -e "${YELLOW}Test 2: POST /api/generations${NC}"
echo "Expected: generation_id and flashcards_proposals array"

SOURCE_TEXT=$(cat test-source-text.txt)
RESPONSE=$(curl -s -X POST "$BASE_URL/generations" \
  -H "Content-Type: application/json" \
  -d "{\"source_text\": \"$SOURCE_TEXT\"}")

echo "$RESPONSE" | json_pp
echo ""

# Extract generation_id for next test
GENERATION_ID=$(echo "$RESPONSE" | grep -o '"generation_id":[0-9]*' | grep -o '[0-9]*')
echo -e "${GREEN}Generated ID: $GENERATION_ID${NC}"
echo "---"
echo ""

# Test 3: POST /api/flashcards (save proposals)
echo -e "${YELLOW}Test 3: POST /api/flashcards${NC}"
echo "Expected: Created flashcards with IDs"

# Create flashcards from the proposals
curl -s -X POST "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -d "{
    \"flashcards\": [
      {
        \"front\": \"What is TypeScript?\",
        \"back\": \"A strongly typed programming language that builds on JavaScript\",
        \"source\": \"ai-full\",
        \"generation_id\": $GENERATION_ID
      },
      {
        \"front\": \"Who maintains TypeScript?\",
        \"back\": \"Microsoft\",
        \"source\": \"ai-full\",
        \"generation_id\": $GENERATION_ID
      }
    ]
  }" | json_pp

echo ""
echo "---"
echo ""

# Test 4: GET /api/flashcards (should show created flashcards)
echo -e "${YELLOW}Test 4: GET /api/flashcards (after creation)${NC}"
echo "Expected: List with newly created flashcards"
curl -s -X GET "$BASE_URL/flashcards" | json_pp
echo ""
echo "---"
echo ""

# Test 5: POST /api/flashcards (manual flashcard)
echo -e "${YELLOW}Test 5: POST /api/flashcards (manual)${NC}"
echo "Expected: Created manual flashcard"

curl -s -X POST "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -d '{
    "flashcards": [
      {
        "front": "Manual test question",
        "back": "Manual test answer",
        "source": "manual",
        "generation_id": null
      }
    ]
  }' | json_pp

echo ""
echo "---"
echo ""

# Test 6: Error test - source text too short
echo -e "${YELLOW}Test 6: POST /api/generations (error: too short)${NC}"
echo "Expected: 400 error"

curl -s -X POST "$BASE_URL/generations" \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Too short"}' | json_pp

echo ""
echo "---"
echo ""

# Test 7: Error test - invalid flashcard data
echo -e "${YELLOW}Test 7: POST /api/flashcards (error: missing generation_id for ai-full)${NC}"
echo "Expected: 400 validation error"

curl -s -X POST "$BASE_URL/flashcards" \
  -H "Content-Type: application/json" \
  -d '{
    "flashcards": [
      {
        "front": "Test",
        "back": "Test",
        "source": "ai-full",
        "generation_id": null
      }
    ]
  }' | json_pp

echo ""
echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
