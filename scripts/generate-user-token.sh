#!/bin/bash
# Generate Portal MCP token on behalf of a user
# Usage: ./generate-user-token.sh <admin-user> <admin-password> <target-user> [lifetime-days]

PORTAL_URL="${PORTAL_URL:-https://udi.ctera.me}"
ADMIN_USER="${1:-admin}"
ADMIN_PASSWORD="${2}"
TARGET_USER="${3}"
LIFETIME_DAYS="${4:-90}"

if [ -z "$ADMIN_PASSWORD" ] || [ -z "$TARGET_USER" ]; then
    echo "Usage: $0 <admin-user> <admin-password> <target-user> [lifetime-days]"
    echo ""
    echo "Example:"
    echo "  $0 admin 'AdminPass123!' n8n-service 90"
    echo ""
    echo "Environment variables:"
    echo "  PORTAL_URL - Portal base URL (default: https://udi.ctera.me)"
    exit 1
fi

echo "🔐 Generating token for user: $TARGET_USER"
echo "📅 Lifetime: $LIFETIME_DAYS days"
echo "🌐 Portal: $PORTAL_URL"
echo ""

# Step 1: Login as admin
echo "🔑 Logging in as admin..."
LOGIN_RESPONSE=$(curl -sk -c /tmp/admin-cookies.txt \
  -X POST "$PORTAL_URL/ServicesPortal/api/login?j_username=$ADMIN_USER&j_password=$ADMIN_PASSWORD" 2>&1)

if ! echo "$LOGIN_RESPONSE" | grep -q "success\|200"; then
    echo "❌ Admin login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Admin logged in"
echo ""

# Step 2: Generate token for target user
echo "🎫 Generating token for $TARGET_USER..."
TOKEN_RESPONSE=$(curl -sk -b /tmp/admin-cookies.txt \
  -X POST "$PORTAL_URL/ServicesPortal/v2/auth/token" \
  -H "Content-Type: application/json" \
  -d "{\"audience\":\"mcp\",\"subject\":\"$TARGET_USER\",\"lifetime_days\":$LIFETIME_DAYS}" 2>&1)

# Extract token
TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token // empty' 2>/dev/null)
EXPIRES=$(echo "$TOKEN_RESPONSE" | jq -r '.expires_at // empty' 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Token generation failed"
    echo "$TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Token generated successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Token Details"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "User:       $TARGET_USER"
echo "Expires:    $EXPIRES"
echo "Lifetime:   $LIFETIME_DAYS days"
echo ""
echo "🎫 Token (copy this for n8n):"
echo "$TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 To use in n8n:"
echo "  1. Go to Credentials → Add Credential"
echo "  2. Select 'CTERA Filesystem API'"
echo "  3. MCP Server URL: https://udi.ctera.me/_SRV/MCP"
echo "  4. Bearer Token: Paste the token above"
echo "  5. Save!"
echo ""

# Cleanup
rm -f /tmp/admin-cookies.txt

exit 0
