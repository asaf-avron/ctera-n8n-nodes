# 🧪 Local Testing Guide for n8n CTERA Filesystem Node

**Date**: December 28, 2024  
**Purpose**: Step-by-step guide to test the n8n Filesystem node locally

---

## Overview

Testing involves **3 layers**:
1. **Portal Backend** (Java) - JWT token generation & user authentication
2. **MCP Service** (Python) - The filesystem API backend
3. **n8n Node** (TypeScript) - Your custom node

---

## Prerequisites

| Component | Location | Purpose |
|-----------|----------|---------|
| Portal Backend | `C:\dev\Backend\Backend` | JWT tokens, authentication |
| MCP Service | `C:\dev\ctera-mcp-service` | Filesystem API |
| MCP Base | `C:\dev\ctera-mcp-base` | MCP infrastructure |
| n8n Nodes | `C:\dev\ctera-n8n-nodes` | Custom n8n nodes |

**Required Tools:**
- Docker & Docker Compose
- Node.js 18+
- Java 11+ (for Portal)
- Python 3.9+ (optional, for token generation)
- Git Bash or WSL (on Windows)

---

## Step 1: Start Portal Backend

The Portal provides JWT token generation and user management.

### Option A: Using Gradle (Recommended for first-time setup)

```bash
cd C:\dev\Backend\Backend

# Full clean setup (first time or after major changes)
./gradlew :portal-server:devenv-clean_init_run

# Or just init and run (if Docker containers already exist)
./gradlew :portal-server:devenv-init_run

# Or just start Tomcat (if everything is already set up)
./gradlew :portal-server:tomcat-start
```

### Option B: Using telnet console (Windows CMD/PowerShell)

If you have the CTERA console tools installed:

```cmd
cd C:\dev\Backend\Backend
telnet 0
```

Wait for Portal to start, then run initialization commands (see `scripts/init-portal.txt`).

### 1.2 Initialize Portal (Manual - if using telnet)

Once ready, run initialization commands:

```bash
init-server master
init-db admin asafa@ctera.com password1! ctera.me mail.authsmtp.com ac44538 activenas08!
login admin admin admin password1!
set /settings/logsSettings/severity trace
set /settings/enableEmailSending false
install-license DPF44-FE11E-70250-7830E-SC350-WC350-JC350-UC350-LC350-GC350-HC350-IC350-KC350-V1R1
add /portals/portal/users/ name a1 firstName f1 lastName l1 password password1! email a1@ctera.com accountStatus active
add /portals/portal/users/ name a2 firstName f2 lastName l2 password password1! email a2@ctera.com accountStatus active
add /portals/portal/users/ name a3 firstName f3 lastName l3 password password1! email a3@ctera.com accountStatus active
```

### 1.3 Using Gradle init-db task (Alternative)

```bash
# Set your email in local.properties first:
echo "portal.init.email=asafa@ctera.com" >> portal-server/local.properties

# Then run:
./gradlew :portal-server:init-db
```

**Portal will be available at:** https://localhost:8443 (or your configured port)

---

## Step 2: Start MCP Service

### 2.1 Build MCP Docker Image

```bash
cd C:\dev\ctera-mcp-service

# Set GitHub token (required for private repos)
export GITHUB_TOKEN=your_github_pat

# Build MCP image
./dev/dev.sh docker mcp
```

### 2.2 Start MCP Service

```bash
# Using docker-compose
docker-compose -f dev/docker-compose.mcp.yml up -d

# Verify it's running
curl http://localhost:81/_SRV/MCP/openapi.json
```

**MCP will be available at:** http://localhost:81

### 2.3 Docker Compose Configuration

The `dev/docker-compose.mcp.yml` exposes:
- **Port 81** → MCP service (internal 8001)
- **Environment**: Connects to Portal at `host.docker.internal:443`

---

## Step 3: Get JWT Token

### Option A: From Portal Admin UI

1. Login to Portal: https://localhost:8443
2. Navigate to MCP Tokens section
3. Generate new token with desired expiration

### Option B: Using API

```bash
# First, get a session cookie by logging in
curl -k -c cookies.txt -X POST "https://localhost:8443/admin/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password1!"}'

# Generate MCP token
curl -k -b cookies.txt -X POST "https://localhost:8443/admin/api/mcp-tokens/generate" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}' | jq -r .token
```

### Option C: Using Test Script

```bash
cd C:\dev\ctera-n8n-nodes\scripts
python generate_test_token.py
```

---

## Step 4: Test MCP API with curl

Use the test script or run commands manually:

```bash
cd C:\dev\ctera-n8n-nodes\scripts

# Set your token
export TOKEN="your-jwt-token-here"

# Run all tests
./test-mcp-api.sh
```

### Manual curl Examples

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR..."
MCP_URL="http://localhost:81/_SRV/MCP"

# List available tools
curl -s -X POST "$MCP_URL/tools" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | jq .

# List files in root
curl -s -X POST "$MCP_URL/tools/call" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {"name": "list_directory", "arguments": {"path": "/"}},
    "id": 2
  }' | jq .
```

---

## Step 5: Run n8n with Custom Node

### 5.1 Build the Node

```bash
cd C:\dev\ctera-n8n-nodes

# Install dependencies
npm install

# Build
npm run build

# Link for local development
npm link
```

### 5.2 Link to n8n

```bash
# Create n8n custom nodes directory
mkdir -p ~/.n8n/nodes

# Link your package
cd ~/.n8n/nodes
npm link @ctera/n8n-nodes-ctera
```

### 5.3 Start n8n

```bash
# Start n8n
npx n8n

# Or with debug logging
N8N_LOG_LEVEL=debug npx n8n
```

**n8n will be available at:** http://localhost:5678

---

## Step 6: Configure n8n Credentials

1. Open http://localhost:5678
2. Go to **Credentials** → **Add Credential**
3. Search for "CTERA Filesystem" (or "CTERA" if using existing)
4. Configure:
   - **MCP Server URL**: `http://localhost:81`
   - **Bearer Token**: Your JWT token from Step 3
   - **Ignore SSL Issues**: ✓ Enable (for local testing)

---

## Step 7: Test in n8n

1. Create a new workflow
2. Add **CTERA Filesystem** node
3. Select operation (e.g., "List Files")
4. Configure:
   - Path: `/`
5. Execute and verify results

---

## Quick Reference

### Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Portal Admin | https://localhost:8443 | Admin UI, token generation |
| Portal API | https://localhost:8443/api | REST API |
| MCP Service | http://localhost:81/_SRV/MCP | Filesystem operations |
| n8n | http://localhost:5678 | Workflow automation |

### JSON-RPC Methods

| Method | Description |
|--------|-------------|
| `tools/list` | List available operations |
| `list_directory` | List files in folder |
| `get_file_info` | Get file metadata |
| `read_file` | Download file content |
| `write_file` | Upload file |
| `create_folder` | Create directory |
| `delete` | Delete file/folder |
| `move` | Move file/folder |
| `copy` | Copy file/folder |

### Test Users (Created in Step 1)

| User | Email | Password |
|------|-------|----------|
| admin | asafa@ctera.com | password1! |
| a1 | a1@ctera.com | password1! |
| a2 | a2@ctera.com | password1! |
| a3 | a3@ctera.com | password1! |

---

## Development Workflow

### Watch Mode (Rapid Iteration)

```bash
# Terminal 1: Portal
cd C:\dev\Backend\Backend && telnet 0

# Terminal 2: MCP Service
cd C:\dev\ctera-mcp-service
docker-compose -f dev/docker-compose.mcp.yml up

# Terminal 3: n8n Node (watch mode)
cd C:\dev\ctera-n8n-nodes && npm run dev

# Terminal 4: n8n
npx n8n
```

### After Code Changes

1. n8n node changes: `npm run build` → Restart n8n
2. MCP service changes: Rebuild Docker image
3. Portal changes: Restart telnet session

---

## Troubleshooting

### Portal Issues

```bash
# Check Portal logs
tail -f C:\dev\Backend\Backend\logs\*.log

# Restart Portal
# Exit telnet (Ctrl+C), then telnet 0 again
```

### MCP Service Issues

```bash
# Check logs
docker-compose -f dev/docker-compose.mcp.yml logs -f

# Restart
docker-compose -f dev/docker-compose.mcp.yml restart

# Health check
curl http://localhost:81/_SRV/MCP/health
```

### Token Issues

```bash
# Decode JWT to check claims
echo $TOKEN | cut -d. -f2 | base64 -d | jq .

# Verify expiration (exp should be in future)
```

### n8n Node Issues

```bash
# Clear cache
rm -rf ~/.n8n/.cache

# Verify node is registered
# Search for "CTERA" in n8n node panel

# Debug logging
N8N_LOG_LEVEL=debug npx n8n
```

---

## Files in This Repository

| File | Purpose |
|------|---------|
| `docs/LOCAL_TESTING_GUIDE.md` | This guide |
| `scripts/test-mcp-api.sh` | API test script |
| `scripts/generate_test_token.py` | Token generator |
| `scripts/init-portal.txt` | Portal init commands |

---

## Related Documentation

- [n8n-ctera-filesystem-node-spec.md](designs/n8n-filesystem-node/n8n-ctera-filesystem-node-spec.md) - Full specification
- [GENERIC_JWT_FRAMEWORK_DESIGN.md](designs/n8n-filesystem-node/GENERIC_JWT_FRAMEWORK_DESIGN.md) - JWT design
- [MCP_IMPLEMENTATION_FINDINGS.md](designs/n8n-filesystem-node/MCP_IMPLEMENTATION_FINDINGS.md) - MCP findings

