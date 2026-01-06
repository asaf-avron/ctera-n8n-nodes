#!/bin/bash
# Get a JWT token from CTERA Portal for MCP authentication
# Usage: ./get-portal-token.sh [username] [password]

PORTAL_URL="${PORTAL_URL:-https://127.0.0.1:443}"
USERNAME="${1:-a1}"
PASSWORD="${2:-password1!}"

echo "=========================================="
echo "CTERA Portal Token Generator"
echo "=========================================="
echo "Portal: $PORTAL_URL/ServicesPortal"
echo "User:   $USERNAME"
echo ""

# Get token from Portal
echo "Requesting token..."
RESPONSE=$(curl -sk -X POST "$PORTAL_URL/ServicesPortal/v1/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$USERNAME&password=$PASSWORD" 2>&1)

# Check if we got a token
if echo "$RESPONSE" | grep -q "access_token\|token"; then
    echo "✅ Token received!"
    echo ""
    echo "=========================================="
    echo "Response:"
    echo "=========================================="
    echo "$RESPONSE" | python -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    # Extract token if it's JSON
    TOKEN=$(echo "$RESPONSE" | python -c "import sys,json; print(json.load(sys.stdin).get('access_token', json.load(sys.stdin).get('token', '')))" 2>/dev/null)
    
    if [ -n "$TOKEN" ]; then
        echo "=========================================="
        echo "Token for MCP:"
        echo "=========================================="
        echo "$TOKEN"
        echo ""
        echo "=========================================="
        echo "Export command:"
        echo "=========================================="
        echo "export TOKEN=\"$TOKEN\""
    fi
else
    echo "❌ Failed to get token"
    echo "Response: $RESPONSE"
fi


