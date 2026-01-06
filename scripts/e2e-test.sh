#!/bin/bash
# End-to-end test for CTERA Filesystem n8n node
# Tests the full flow: Portal → Token → MCP → Operations

set -e

PORTAL_URL="${PORTAL_URL:-https://127.0.0.1:443}"
MCP_URL="${MCP_URL:-http://localhost:81}"
USERNAME="${1:-a1}"
PASSWORD="${2:-password1!}"

echo "============================================================"
echo "CTERA Filesystem Node - End-to-End Test"
echo "============================================================"
echo "Portal:   $PORTAL_URL/ServicesPortal"
echo "MCP:      $MCP_URL"
echo "User:     $USERNAME"
echo "============================================================"
echo ""

# Step 1: Get token from Portal
echo "📥 Step 1: Getting token from Portal..."
TOKEN_RESPONSE=$(curl -sk -X POST "$PORTAL_URL/ServicesPortal/v1/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$USERNAME&password=$PASSWORD" 2>&1)

# Try to extract token from various response formats
TOKEN=$(echo "$TOKEN_RESPONSE" | python -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('access_token') or data.get('token') or data.get('jwt') or '')
except:
    print('')
" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    # Maybe the response IS the token directly
    if [[ "$TOKEN_RESPONSE" == eyJ* ]]; then
        TOKEN="$TOKEN_RESPONSE"
    else
        echo "❌ Failed to get token from Portal"
        echo "Response: $TOKEN_RESPONSE"
        exit 1
    fi
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

# Function to call MCP
call_mcp() {
    local name=$1
    local args=$2
    local id=$3
    
    curl -s -X POST "$MCP_URL/mcp/" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"$name\",\"arguments\":$args},\"id\":$id}"
}

# Step 2: Test MCP connection
echo "🔌 Step 2: Testing MCP connection..."
HEALTH=$(curl -s "$MCP_URL/health" 2>&1)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ MCP service is healthy"
else
    echo "❌ MCP service not responding"
    echo "Response: $HEALTH"
    exit 1
fi
echo ""

# Step 3: Run filesystem operations
echo "🧪 Step 3: Running filesystem tests..."
echo "------------------------------------------------------------"

# Test 3.1: Create test directory
echo "📁 Creating test directory /n8n-e2e-test..."
RESULT=$(call_mcp "ctera_portal_create_directory" '{"path":"/n8n-e2e-test"}' 1)
echo "   Result: $RESULT"
echo ""

# Test 3.2: Write a file
echo "📝 Writing file /n8n-e2e-test/hello.txt..."
RESULT=$(call_mcp "ctera_portal_upload_from_content" '{"filepath":"/n8n-e2e-test/hello.txt","content":"Hello from n8n Filesystem Node!"}' 2)
echo "   Result: $RESULT"
echo ""

# Test 3.3: List directory
echo "📂 Listing /n8n-e2e-test..."
RESULT=$(call_mcp "ctera_portal_list_dir" '{"path":"/n8n-e2e-test","include_deleted":false}' 3)
echo "   Result: $RESULT"
echo ""

# Test 3.4: Read file
echo "📖 Reading /n8n-e2e-test/hello.txt..."
RESULT=$(call_mcp "ctera_portal_read_file" '{"path":"/n8n-e2e-test/hello.txt"}' 4)
echo "   Result: $RESULT"
echo ""

# Test 3.5: Create public link
echo "🔗 Creating public link..."
RESULT=$(call_mcp "ctera_portal_create_public_link" '{"path":"/n8n-e2e-test/hello.txt","access":"RO","expire_in":7}' 5)
echo "   Result: $RESULT"
echo ""

# Test 3.6: Get permalink
echo "🔗 Getting permalink..."
RESULT=$(call_mcp "ctera_portal_get_permalink" '{"path":"/n8n-e2e-test/hello.txt"}' 6)
echo "   Result: $RESULT"
echo ""

# Test 3.7: Copy file
echo "📋 Copying file..."
RESULT=$(call_mcp "ctera_portal_copy_item" '{"source":"/n8n-e2e-test/hello.txt","destination":"/n8n-e2e-test/hello-copy.txt"}' 7)
echo "   Result: $RESULT"
echo ""

# Test 3.8: Rename file
echo "✏️ Renaming copied file..."
RESULT=$(call_mcp "ctera_portal_rename_item" '{"path":"/n8n-e2e-test/hello-copy.txt","new_name":"renamed.txt"}' 8)
echo "   Result: $RESULT"
echo ""

# Test 3.9: List versions (if versioning enabled)
echo "📜 Listing file versions..."
RESULT=$(call_mcp "ctera_portal_list_versions" '{"path":"/n8n-e2e-test/hello.txt"}' 9)
echo "   Result: $RESULT"
echo ""

# Cleanup
echo "🧹 Cleanup: Deleting test files..."
RESULT=$(call_mcp "ctera_portal_delete_items" '{"paths":["/n8n-e2e-test/hello.txt","/n8n-e2e-test/renamed.txt"]}' 10)
echo "   Result: $RESULT"
echo ""

echo "🧹 Cleanup: Deleting test directory..."
RESULT=$(call_mcp "ctera_portal_delete_items" '{"paths":["/n8n-e2e-test"]}' 11)
echo "   Result: $RESULT"
echo ""

echo "============================================================"
echo "✅ End-to-End Test Complete!"
echo "============================================================"


