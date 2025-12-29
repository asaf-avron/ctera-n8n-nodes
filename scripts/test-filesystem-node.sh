#!/bin/bash
# Test script for CteraFilesystem node against live MCP service
# Usage: ./test-filesystem-node.sh [TOKEN]

set -e

MCP_URL="${MCP_URL:-http://localhost:81}"
TOKEN="${1:-$TOKEN}"

if [ -z "$TOKEN" ]; then
    echo "Error: No token provided"
    echo "Usage: ./test-filesystem-node.sh <JWT_TOKEN>"
    echo "Or set TOKEN environment variable"
    exit 1
fi

echo "=========================================="
echo "CTERA Filesystem Node Test Suite"
echo "=========================================="
echo "MCP URL: $MCP_URL"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Function to make MCP call
call_mcp() {
    local name=$1
    local args=$2
    local id=$3
    
    curl -s -X POST "$MCP_URL/mcp/" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"$name\",\"arguments\":$args},\"id\":$id}"
}

# Test 1: Who am I
echo "Test 1: Who am I"
result=$(call_mcp "ctera_portal_who_am_i" "{}" 1)
echo "Result: $result"
echo ""

# Test 2: List root directory
echo "Test 2: List Directory (/)"
result=$(call_mcp "ctera_portal_list_dir" "{\"path\":\"/\",\"include_deleted\":false}" 2)
echo "Result: $result"
echo ""

# Test 3: Create directory
echo "Test 3: Create Directory (/test-n8n-node)"
result=$(call_mcp "ctera_portal_create_directory" "{\"path\":\"/test-n8n-node\"}" 3)
echo "Result: $result"
echo ""

# Test 4: Write file
echo "Test 4: Write File (/test-n8n-node/hello.txt)"
result=$(call_mcp "ctera_portal_upload_from_content" "{\"filepath\":\"/test-n8n-node/hello.txt\",\"content\":\"Hello from n8n!\"}" 4)
echo "Result: $result"
echo ""

# Test 5: Read file
echo "Test 5: Read File (/test-n8n-node/hello.txt)"
result=$(call_mcp "ctera_portal_read_file" "{\"path\":\"/test-n8n-node/hello.txt\"}" 5)
echo "Result: $result"
echo ""

# Test 6: List directory contents
echo "Test 6: List Directory (/test-n8n-node)"
result=$(call_mcp "ctera_portal_list_dir" "{\"path\":\"/test-n8n-node\",\"include_deleted\":false}" 6)
echo "Result: $result"
echo ""

# Test 7: Get permalink
echo "Test 7: Get Permalink (/test-n8n-node/hello.txt)"
result=$(call_mcp "ctera_portal_get_permalink" "{\"path\":\"/test-n8n-node/hello.txt\"}" 7)
echo "Result: $result"
echo ""

# Test 8: Delete file
echo "Test 8: Delete File (/test-n8n-node/hello.txt)"
result=$(call_mcp "ctera_portal_delete_items" "{\"paths\":[\"/test-n8n-node/hello.txt\"]}" 8)
echo "Result: $result"
echo ""

# Test 9: Delete directory
echo "Test 9: Delete Directory (/test-n8n-node)"
result=$(call_mcp "ctera_portal_delete_items" "{\"paths\":[\"/test-n8n-node\"]}" 9)
echo "Result: $result"
echo ""

echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="

