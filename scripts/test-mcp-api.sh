#!/bin/bash
# ============================================================================
# MCP Filesystem API Test Script
# ============================================================================
# Usage: ./test-mcp-api.sh [TOKEN]
#   or:  TOKEN=xxx ./test-mcp-api.sh
# ============================================================================

set -e

# Configuration
MCP_URL="${MCP_URL:-http://localhost:81/_SRV/MCP}"
TOKEN="${1:-$TOKEN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "\n${YELLOW}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: No JWT token provided${NC}"
    echo ""
    echo "Usage:"
    echo "  ./test-mcp-api.sh YOUR_JWT_TOKEN"
    echo "  or"
    echo "  TOKEN=YOUR_JWT_TOKEN ./test-mcp-api.sh"
    echo ""
    echo "Get a token from Portal Admin UI or use generate_test_token.py"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq not found, output will not be formatted${NC}"
    JQ_CMD="cat"
else
    JQ_CMD="jq ."
fi

# Check if MCP service is reachable
print_header "Checking MCP Service"
if curl -s -o /dev/null -w "%{http_code}" "$MCP_URL/openapi.json" | grep -q "200"; then
    print_success "MCP service is reachable at $MCP_URL"
else
    print_error "MCP service not reachable at $MCP_URL"
    echo "Make sure MCP service is running:"
    echo "  cd /c/dev/ctera-mcp-service"
    echo "  docker-compose -f dev/docker-compose.mcp.yml up -d"
    exit 1
fi

# ============================================================================
# Test 1: List Available Tools
# ============================================================================
print_header "Test 1: List Available Tools"
print_test "Fetching list of available MCP tools..."

RESPONSE=$(curl -s -X POST "$MCP_URL/tools" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}')

echo "$RESPONSE" | $JQ_CMD

if echo "$RESPONSE" | grep -q "result"; then
    print_success "Tools list retrieved successfully"
else
    print_error "Failed to retrieve tools list"
fi

# ============================================================================
# Test 2: List Root Directory
# ============================================================================
print_header "Test 2: List Root Directory"
print_test "Listing files in root directory..."

RESPONSE=$(curl -s -X POST "$MCP_URL/tools/call" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_directory",
      "arguments": {"path": "/"}
    },
    "id": 2
  }')

echo "$RESPONSE" | $JQ_CMD

if echo "$RESPONSE" | grep -q "result"; then
    print_success "Root directory listed successfully"
else
    print_error "Failed to list root directory"
fi

# ============================================================================
# Test 3: Create Test Folder
# ============================================================================
print_header "Test 3: Create Test Folder"
TEST_FOLDER="/n8n-test-folder-$(date +%s)"
print_test "Creating folder: $TEST_FOLDER"

RESPONSE=$(curl -s -X POST "$MCP_URL/tools/call" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"create_folder\",
      \"arguments\": {\"path\": \"$TEST_FOLDER\"}
    },
    \"id\": 3
  }")

echo "$RESPONSE" | $JQ_CMD

if echo "$RESPONSE" | grep -q "result"; then
    print_success "Folder created successfully"
else
    print_error "Failed to create folder (may already exist or permission denied)"
fi

# ============================================================================
# Test 4: Get Folder Info
# ============================================================================
print_header "Test 4: Get Folder Info"
print_test "Getting info for: $TEST_FOLDER"

RESPONSE=$(curl -s -X POST "$MCP_URL/tools/call" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"get_file_info\",
      \"arguments\": {\"path\": \"$TEST_FOLDER\"}
    },
    \"id\": 4
  }")

echo "$RESPONSE" | $JQ_CMD

if echo "$RESPONSE" | grep -q "result"; then
    print_success "Folder info retrieved successfully"
else
    print_error "Failed to get folder info"
fi

# ============================================================================
# Test 5: Delete Test Folder (Cleanup)
# ============================================================================
print_header "Test 5: Delete Test Folder (Cleanup)"
print_test "Deleting folder: $TEST_FOLDER"

RESPONSE=$(curl -s -X POST "$MCP_URL/tools/call" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"method\": \"tools/call\",
    \"params\": {
      \"name\": \"delete\",
      \"arguments\": {\"path\": \"$TEST_FOLDER\"}
    },
    \"id\": 5
  }")

echo "$RESPONSE" | $JQ_CMD

if echo "$RESPONSE" | grep -q "result"; then
    print_success "Folder deleted successfully"
else
    print_error "Failed to delete folder"
fi

# ============================================================================
# Summary
# ============================================================================
print_header "Test Summary"
echo -e "${GREEN}All basic API tests completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run n8n: npx n8n"
echo "  2. Configure CTERA credentials with your token"
echo "  3. Test the filesystem node in a workflow"
echo ""
echo "Token used (first 50 chars): ${TOKEN:0:50}..."

