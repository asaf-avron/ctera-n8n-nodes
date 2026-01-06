# CTERA Filesystem Node - Demo Guide

## Quick Demo Script

Run `scripts/demo.sh` to see a live demonstration of the node capabilities.

## What Works Now ✅

### 1. n8n Node Implementation
- ✅ **30 Unit Tests Passing** - All node logic verified
- ✅ **18 Filesystem Operations** - Complete implementation
- ✅ **JSON-RPC 2.0 Protocol** - Proper MCP communication
- ✅ **Error Handling** - Comprehensive error scenarios covered
- ✅ **Credential Management** - Separate credentials from CteraAi node

### 2. MCP Service
- ✅ **Health Check** - Service running and responsive
- ✅ **JWT Token Parsing** - Can decode and validate tokens
- ✅ **Who Am I** - Returns authenticated user identity

### 3. Portal Integration
- ✅ **Token Generation** - `/v2/auth/token` endpoint working
- ✅ **JWT Signing** - Tokens properly signed with HMAC-SHA256
- ✅ **Token Claims** - Valid `sub`, `aud`, `iss`, `exp`, `iat` claims

## Demo Scenarios

### Scenario 1: Token Generation
```bash
# Login and get token
curl -sk -c cookies.txt -X POST "https://127.0.0.1:443/ServicesPortal/api/login?j_username=a1&j_password=password1!"
curl -sk -b cookies.txt -X POST "https://127.0.0.1:443/ServicesPortal/v2/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"audience":"mcp","subject":"a1"}'
```

**Shows**: Portal can generate valid JWT tokens for MCP authentication.

### Scenario 2: MCP Authentication
```bash
TOKEN="<token-from-scenario-1>"
curl -s -X POST "http://localhost:81/mcp/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"ctera_portal_who_am_i","arguments":{}},"id":1}'
```

**Shows**: MCP can parse JWT and identify authenticated user.

### Scenario 3: Unit Tests
```bash
cd /c/dev/ctera-n8n-nodes
npm test
```

**Shows**: All 30 unit tests pass, proving node logic is correct.

### Scenario 4: n8n Node UI
1. Open n8n workflow editor
2. Add "CTERA Filesystem" node
3. Configure credentials:
   - MCP Server URL: `http://localhost:81`
   - Bearer Token: `<token-from-scenario-1>`
   - Ignore SSL Issues: `true` (for local dev)
4. Select resource and operation
5. Configure operation parameters

**Shows**: Complete node UI with all 18 operations available.

## What's Needed for Full E2E 🔧

### Portal Backend Configuration
The Portal's Java backend needs:
1. **JWT Validation Filter** - Validate Bearer tokens on `/ServicesPortal/api/*`
2. **Security Context** - Set user identity from JWT claims
3. **API Trust** - API endpoints trust JWT-authenticated requests

### Testing Full E2E
Once Portal is configured:
```bash
./scripts/e2e-test.sh a1 "password1!"
```

This will test:
- ✅ Directory creation
- ✅ File upload
- ✅ File read
- ✅ File copy/move/rename
- ✅ Link generation
- ✅ Version listing
- ✅ Cleanup

## Architecture Diagram

```
┌─────────────┐
│   n8n UI    │
│  Workflow   │
└──────┬──────┘
       │ HTTP + JSON-RPC 2.0
       │ Authorization: Bearer <JWT>
       ▼
┌─────────────────┐
│   MCP Service   │
│  (Docker)       │
└──────┬──────────┘
       │ HTTPS
       │ Authorization: Bearer <JWT>
       ▼
┌─────────────────┐
│ CTERA Portal    │
│ (Tomcat)        │
│ JWT Filter      │
└─────────────────┘
```

## Next Steps

1. ✅ **Node Implementation** - Complete
2. ✅ **Unit Tests** - Complete
3. ✅ **MCP Integration** - Complete
4. 🔧 **Portal JWT Filter** - In progress
5. ⏳ **Full E2E Testing** - Waiting for Portal config
6. ⏳ **Documentation** - In progress
7. ⏳ **Production Deployment** - After E2E validation
