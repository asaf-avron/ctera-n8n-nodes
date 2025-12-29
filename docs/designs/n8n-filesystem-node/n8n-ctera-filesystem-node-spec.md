# Feature Specification: n8n CTERA Global Filesystem Node

## Document Information

| Field | Value |
|-------|-------|
| **Feature Name** | n8n CTERA Global Filesystem Node |
| **Version** | 1.0 |
| **Date** | December 28, 2024 |
| **Author** | Backend Team |
| **Status** | Draft |
| **Target Release** | TBD |
| **Related Documents** | [n8n CTERA Filesystem Node Confluence](https://cteranet.atlassian.net/wiki/spaces/IT/pages/4788355089/n8n+CTERA+Filesystem+Node) |

---

## 1. Executive Summary

### 1.1 Overview

This feature introduces an **n8n community node** that provides workflow automation capabilities for CTERA Portal-backed storage operations. The CTERA Global Filesystem node enables users to integrate file operations, directory management, versioning, and link generation into their n8n workflows.

### 1.2 Business Value

- **Workflow Automation**: Enable customers to automate file management tasks without writing code
- **Integration Platform**: Position CTERA as part of the broader automation ecosystem
- **Error Handling**: Provide structured error responses enabling intelligent workflow branching and retry logic
- **Developer Experience**: Simplify integration with CTERA Portal through standard n8n interface

### 1.3 Target Users

- **IT Administrators**: Automating file organization, compliance workflows, backup management
- **DevOps Engineers**: Integrating CTERA storage with CI/CD pipelines and deployment workflows
- **Business Analysts**: Building data processing pipelines with file ingestion/export
- **Power Users**: Creating custom workflows for document management and collaboration

---

## 2. Problem Statement

### 2.1 Current State

Customers who want to automate CTERA Portal operations currently must:
- Write custom scripts using CTERA Portal REST API (complex schema, steep learning curve)
- Manage authentication and error handling manually
- Lack visibility into workflow execution and error states
- Cannot easily integrate CTERA with other business systems

### 2.2 Pain Points

1. **Complex API**: Portal REST API requires deep technical knowledge
2. **Authentication Overhead**: Managing credentials and sessions programmatically
3. **No Visual Workflows**: Cannot visualize automation logic
4. **Limited Reusability**: Scripts are hard to share and maintain
5. **Error Handling**: Building robust error handling requires significant effort

### 2.3 Opportunity

n8n is a popular open-source workflow automation platform with:
- 350+ pre-built integrations
- Visual workflow builder
- Active community (30k+ GitHub stars)
- Self-hosted and cloud options
- Growing enterprise adoption

---

## 3. Requirements

### 3.1 Functional Requirements

#### 3.1.1 Authentication & Configuration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Implement **generic Portal JWT framework** (OAuth2 refresh token pattern) | Must Have |
| FR-1.2 | Support access token (JWT, 1 hour) + refresh token (90 days) | Must Have |
| FR-1.3 | Token generation via Portal UI (Settings → API Tokens, not MCP-specific) | Must Have |
| FR-1.4 | Token management: list, revoke, view last used | Must Have |
| FR-1.5 | Token scoping with permissions (filesystem, metadata, etc.) | Must Have |
| FR-1.6 | Token audience support (MCP, Portal API, Mobile, Integration) | Must Have |
| FR-1.7 | Auto-refresh mechanism in n8n node (transparent to user) | Must Have |
| FR-1.8 | SSL certificate validation with optional bypass | Must Have |
| FR-1.9 | Generic framework reusable for all Portal APIs (not just MCP) | Must Have |

#### 3.1.2 File Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | **Write File**: Upload file content (binary or text) | Must Have |
| FR-2.2 | **Write File**: Support overwrite flag | Must Have |
| FR-2.3 | **Write File**: Auto-create parent directories (optional) | Must Have |
| FR-2.4 | **Read File**: Download file content as binary data | Must Have |
| FR-2.5 | **Read File**: Support CTERA Direct for high-performance streaming | Should Have |
| FR-2.6 | **Read File**: Return file metadata (size, timestamps) | Must Have |
| FR-2.7 | **Delete File**: Remove file from Portal | Must Have |

#### 3.1.3 Directory Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | **Create Directory**: Create new directory | Must Have |
| FR-3.2 | **Create Directory**: Auto-create parent directories (optional) | Should Have |
| FR-3.3 | **Delete Directory**: Remove directory | Must Have |
| FR-3.4 | **Delete Directory**: Recursive deletion flag | Must Have |
| FR-3.5 | **Delete Directory**: Return `DIR_NOT_EMPTY` error when recursive=false | Must Have |
| FR-3.6 | **List Directory**: Return entries with metadata | Must Have |
| FR-3.7 | **List Directory**: Support file-only and directory-only filters | Should Have |
| FR-3.8 | **List Directory**: Support recursive traversal | Should Have |
| FR-3.9 | **List Directory**: Fan-out pattern (each entry = separate n8n item) | Must Have |

#### 3.1.4 Metadata Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | **Get File Properties**: Return size, timestamps, owner, permissions | Must Have |
| FR-4.2 | **Get File Properties**: Include CTERA-specific attributes | Should Have |

#### 3.1.5 Versioning Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | **List Versions**: Return all versions with metadata | Must Have |
| FR-5.2 | **List Versions**: Fan-out pattern (each version = separate item) | Should Have |
| FR-5.3 | **Read Previous Version**: Download specific version content | Must Have |
| FR-5.4 | **Read Previous Version**: Support version ID or index | Must Have |
| FR-5.5 | **Restore From Previous Version**: Revert file to older version | Must Have |

#### 3.1.6 Copy & Move Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | **Copy File**: Copy source to target path | Must Have |
| FR-6.2 | **Copy File**: Support overwrite flag | Must Have |
| FR-6.3 | **Copy File**: Cross-cloud-folder support (if Portal allows) | Nice to Have |
| FR-6.4 | **Move File**: Move/rename source to target path | Must Have |
| FR-6.5 | **Move File**: Support overwrite and createParents flags | Must Have |

#### 3.1.7 Link Generation Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | **Create Public Link**: Generate shareable URL | Must Have |
| FR-7.2 | **Create Public Link**: Support Read/Write permission | Must Have |
| FR-7.3 | **Create Public Link**: Support Upload Only permission | Must Have |
| FR-7.4 | **Create Public Link**: Support Read Only permission | Must Have |
| FR-7.5 | **Create Public Link**: Optional expiration (date/time or TTL) | Should Have |
| FR-7.6 | **Get Permalink**: Return stable Portal permalink | Must Have |

#### 3.1.8 Error Handling

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | Structured error response: `{success, operation, path, errorCode, errorMessage}` | Must Have |
| FR-8.2 | Machine-readable error codes for workflow branching | Must Have |
| FR-8.3 | Human-readable error messages | Must Have |
| FR-8.4 | Complete error taxonomy (see Section 4.4) | Must Have |
| FR-8.5 | Enable workflow branching on error codes | Must Have |

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1.1 | File upload/download throughput | Match Portal API performance |
| NFR-1.2 | CTERA Direct read performance | >100 MB/s for large files |
| NFR-1.3 | List directory response time | <2s for 1000 entries |
| NFR-1.4 | Authentication token validation | <100ms |
| NFR-1.5 | Memory usage for large files | Stream-based (no buffering) |

#### 3.2.2 Security

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-2.1 | JWT signature validation using HS256 | Must Have |
| NFR-2.2 | Secure token storage (hashed/encrypted in Portal DB) | Must Have |
| NFR-2.3 | Token revocation support (blocklist) | Must Have |
| NFR-2.4 | No Portal credentials transmitted over network | Must Have |
| NFR-2.5 | Audit logging for all token usage | Must Have |
| NFR-2.6 | Path traversal attack prevention | Must Have |
| NFR-2.7 | Rate limiting per token (optional) | Should Have |

#### 3.2.3 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-3.1 | Support concurrent workflows | 100+ simultaneous operations |
| NFR-3.2 | Token validation without DB lookup | Stateless JWT validation |
| NFR-3.3 | MCP server horizontal scaling | Load balancer compatible |

#### 3.2.4 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-4.1 | Service availability | 99.9% uptime |
| NFR-4.2 | Error recovery | Graceful handling of all API errors |
| NFR-4.3 | Token expiration handling | Clear error messages |

#### 3.2.5 Usability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-5.1 | Token generation UI in Portal | Intuitive, self-service |
| NFR-5.2 | n8n credential setup | <5 minutes for new users |
| NFR-5.3 | Operation parameter descriptions | Clear, with examples |
| NFR-5.4 | Error messages | Actionable, no technical jargon |

---

## 4. Technical Design

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    n8n Workflow (Non-Interactive)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CTERA Global Filesystem Node                            │  │
│  │  - Stores: Portal JWT (60-90 days)                      │  │
│  │  - Manual token refresh (Phase 0)                       │  │
│  │  - Future: Auto-refresh with refresh tokens (Phase 2)   │  │
│  │  Operations: Write, Read, Delete, Copy...               │  │
│  └───────────────────┬──────────────────────────────────────┘  │
└────────────────────┼──────────────────────────────────────────┘
                     │ HTTPS + Portal JWT (Bearer)
                     │ Header: X-Portal-JWT (routing signal)
                     │ POST /_SRV/MCP/mcp
                     │
┌────────────────────▼──────────────────────────────────────────┐
│                    nginx (Routing Layer)                       │
│                                                                 │
│  IF X-Portal-JWT header present:                              │
│    → Route to Portal Backend (JWT validation)                 │
│  ELSE:                                                          │
│    → Route to oauth2-proxy (IdP validation)                   │
└─────────────────────────────────────────────────────────────────┘
          ↓                                    ↓
┌─────────────────────────┐       ┌────────────────────────────┐
│  Portal Backend (Java)  │       │  oauth2-proxy (IdP Auth)  │
│  JWT Validator          │       │  CTERA AI / Interactive   │
└─────────────────────────┘       └────────────────────────────┘
          ↓                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│              CTERA Portal (Backend)                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  GENERIC PORTAL JWT FRAMEWORK (com.ctera.auth.jwt)      │ │
│  │  Extracted from WOPI + Enhanced                          │ │
│  │                                                           │ │
│  │  Components:                                              │ │
│  │  1. JwtService - Main entry point                       │ │
│  │  2. JwtGenerator - Token generation (from WOPI)         │ │
│  │  3. JwtValidator - Signature & expiration (from WOPI)   │ │
│  │  4. SecretProvider - Master key derivation (from WOPI)  │ │
│  │  5. JwtAuthorizationBearerValidator - Bearer auth chain │ │
│  │                                                           │ │
│  │  Token Type (Phase 0):                                   │ │
│  │  - JWT: 60-90 days, HMAC-SHA256 (jose4j)               │ │
│  │                                                           │ │
│  │  Audience Support (TokenAudience enum):                 │ │
│  │  - WOPI (existing - Office Online)                      │ │
│  │  - MCP (new - n8n automation)                           │ │
│  │  - SHARE (new - Portal ↔ Gateway)                       │ │
│  │  - API (future - REST API v2)                           │ │
│  │  - MOBILE (future - mobile apps)                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Bearer Authentication Valve (Existing Infrastructure)   │ │
│  │  - OAuth2JwtBearerValidator (external IdP only)         │ │
│  │  - JwtAuthorizationBearerValidator (NEW - Portal JWT)   │ │
│  │  - NomadAuthorizationBearerValidator (existing)         │ │
│  │  - ApiKeyAuthorizationBearerValidator (existing)        │ │
│  └───────────────────┬──────────────────────────────────────┘ │
│                      │                                          │
│  ┌───────────────────▼──────────────────────────────────────┐ │
│  │  MCP Proxy Handler                                       │ │
│  │  - Validates Portal JWT → UserPrincipal                 │ │
│  │  - Forwards to Envoy with user context                  │ │
│  └───────────────────┬──────────────────────────────────────┘ │
│                      │                                          │
│  ┌───────────────────▼──────────────────────────────────────┐ │
│  │  Envoy → MCP Python Service                             │ │
│  │  - Receives authenticated requests                       │ │
│  │  - Executes filesystem operations                       │ │
│  │  - Returns JSON-RPC 2.0 responses                       │ │
│  └───────────────────┬──────────────────────────────────────┘ │
│                      │                                          │
│  ┌───────────────────▼──────────────────────────────────────┐ │
│  │  CTERA Portal Python SDK (Existing)                     │ │
│  │  - File operations, directory management, versioning    │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

Note: Dual authentication paths support both interactive (CTERA AI) 
      and non-interactive (n8n) use cases.
```

### 4.2 Component Details

#### 4.2.1 Generic Portal JWT Framework (Backend - Java)

**Design Approach**:
- ✅ **Extract from WOPI**: Leverage existing `WOPIUtils.java` JWT code
- ✅ **Library**: jose4j (already in classpath, used by WOPI)
- ✅ **Algorithm**: HMAC-SHA256 (same as WOPI)
- ✅ **Secrets**: Master key derivation pattern (same as WOPI)
- ✅ **Phase 0**: Long-lived JWTs (60-90 days), manual refresh
- ✅ **Future Phase 2**: Add refresh tokens (1h access + 90d refresh)
- ✅ **Scope**: Audience-only initially (no fine-grained permissions)

**NEW Package Structure**: `com.ctera.auth.jwt` (Generic, reusable)

**Phase 0 - JWT Only** (Current implementation):
```
Common/src/main/java/com/ctera/auth/jwt/
├── core/
│   ├── JwtService.java              // Main entry point
│   ├── JwtGenerator.java            // JWT generation (extracted from WOPI)
│   ├── JwtValidator.java            // JWT validation (extracted from WOPI)
│   └── JwtConfig.java               // Configuration
├── models/
│   ├── TokenAudience.java           // Enum: WOPI, MCP, SHARE, API, MOBILE
│   ├── JwtClaims.java               // Validated claims model
│   └── JwtToken.java                // Token metadata
├── secrets/
│   ├── SecretProvider.java          // Interface for secret retrieval
│   ├── PortalSecretProvider.java    // Master key derivation (from WOPI)
│   ├── SharedSecretProvider.java    // Shared secrets (Portal ↔ Gateway)
│   └── SecretDerivation.java        // HMAC-SHA256 derivation (from WOPI)
├── validators/
│   └── JwtAuthorizationBearerValidator.java  // Spring Security integration
├── exceptions/
│   ├── JwtAuthenticationException.java
│   ├── TokenExpiredException.java
│   └── InvalidAudienceException.java
└── config/
    └── JwtConfig.java               // Configuration (expiry, issuer)
```

**Phase 2 - Add Refresh Tokens** (Future):
```
├── core/
│   ├── RefreshTokenManager.java     // Refresh token operations
│   └── TokenRevocationManager.java  // Revocation list
├── models/
│   ├── TokenPair.java               // Access + refresh token pair
│   └── RefreshToken.java            // Refresh token model
├── storage/
│   ├── RefreshTokenRepository.java  // DB interface for refresh tokens
│   └── TokenRevocationRepository.java // DB interface for revocation list
└── validators/
    └── RefreshTokenValidator.java   // Refresh token validation
```

**Technology Stack**:
- Java (existing Portal Backend)
- **jose4j library** for JWT operations (already in Portal - used by WOPI)
- Master key derivation (HMAC-SHA256, same as WOPI `generateOfficeKey`)
- Existing Portal infrastructure
- Plugs into existing `AuthenticationBearerAuthenticator` valve
- nginx routing for dual authentication path (oauth2-proxy + Portal JWT)

**Code Extraction Plan**:
See `WOPI_CODE_EXTRACTION_PLAN.md` for detailed implementation steps.

**Secret Management**:
See `PORTAL_CONFIGURATION_SHARED_SECRETS.md` for configuration details.

#### 4.2.2 Token Management REST API (Backend - Java)

**Generic Endpoints** (NOT MCP-specific):

**Phase 0 - JWT Only (Current Implementation)**:

1. **Token Generation** (`POST /api/auth/tokens/generate`)
   - Input: `{audience: "mcp", lifetime_days: 60}`
   - Returns: JWT token (60-90 days, HMAC-SHA256)
   - Stateless (no database storage)
   - Example: `{"token": "eyJhbGciOiJIUzI1NiIs...", "expires_at": "2025-03-28T10:00:00Z"}`

2. **Token Validation** (`POST /api/auth/tokens/validate`) - For debugging
   - Input: `{token: "eyJ...", audience: "mcp"}`
   - Returns: `{valid: true, subject: "admin@company.com", claims: {...}}`
   - Used for testing/troubleshooting

3. **Token Management UI (Phase 0)**
   - Portal Settings → API Tokens (generic, not MCP-specific)
   - Manual token generation with copy button
   - No revocation (tokens expire naturally after 60-90 days)
   - Display expiration date and audience

**Future Phase 2 - Add Refresh Tokens**:

4. **Token Refresh** (`POST /api/auth/tokens/refresh`)
   - Input: refresh token (opaque, 90d)
   - Returns: new access token (JWT, 1h) + same refresh token
   - Updates last_used timestamp in database

5. **Token Revocation** (`DELETE /api/auth/tokens/{tokenId}`)
   - Revoke specific refresh token
   - Access tokens expire naturally (1h)

6. **Token List** (`GET /api/auth/tokens`)
   - List user's active refresh tokens
   - Filter by audience: MCP, Portal API, Mobile, etc.
   - Last used timestamp, expiration display

#### 4.2.3 n8n Node Components (Frontend - TypeScript)

**Repository**: Extend existing `ctera-n8n-nodes` repository

**New Files**:
- `credentials/CteraPortalAuth.credentials.ts` - Generic JWT credential type
- `nodes/CteraFilesystem/CteraFilesystem.node.ts` - Main node implementation
- `nodes/CteraFilesystem/ctera-filesystem.svg` - Node icon

**Credentials Structure (Phase 0)**:
```typescript
{
  serverUrl: string,           // Portal URL (e.g., https://portal.company.com)
  portalJwt: string,           // Portal JWT (60-90 days, long-lived)
  allowUnauthorizedCerts: bool // For self-signed certificates
}
```

**Token Lifecycle (Phase 0)**:
- User manually generates JWT via Portal UI (`/admin/api-tokens`)
- User copies JWT into n8n credential configuration
- JWT valid for 60-90 days (configurable)
- User manually regenerates JWT when expired
- No automatic refresh (manual process)

**Future Phase 2 - Add Auto-Refresh**:
```typescript
{
  serverUrl: string,
  accessToken: string,         // JWT access token (1h, short-lived)
  refreshToken: string,        // Refresh token (90d)
  allowUnauthorizedCerts: bool
}
```

**Auto-Refresh Logic (Phase 2)**:
- Node automatically refreshes access token when it receives 401
- Calls `/api/auth/tokens/refresh` with refresh token
- Updates stored access token in n8n credentials
- Retries original request with new token
- Transparent to user (no workflow interruption)

**Technology Stack**:
- TypeScript
- n8n-workflow SDK
- Node.js HTTP client (via `this.helpers.httpRequest()`)

#### 4.2.4 Dual Authentication Path (nginx + Portal Backend)

**Problem**: MCP service uses oauth2-proxy (IdP-based, interactive) but n8n needs non-interactive Portal JWTs.

**Solution**: nginx routing based on `X-Portal-JWT` header:

```nginx
location = /_SRV/MCP/mcp {
    # Check for Portal JWT signal
    set $auth_backend "";
    if ($http_x_portal_jwt = "true") {
        set $auth_backend "portal";
    }
    
    # Route 1: Portal JWT → Portal Backend
    if ($auth_backend = "portal") {
        # Extract JWT from Authorization header
        auth_request /auth/portal-jwt;
        proxy_pass http://tomcat/_SRV/MCP/mcp;
        break;
    }
    
    # Route 2: oauth2-proxy (default for CTERA AI)
    auth_request /auth;
    error_page 401 = @oauth2_redirect;
    proxy_pass http://envoy/_SRV/MCP/mcp/;
}

# Portal JWT validation endpoint
location = /auth/portal-jwt {
    internal;
    proxy_pass http://tomcat/api/auth/validate-jwt;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header Authorization $http_authorization;
}
```

**Flow**:
1. **n8n → nginx**: Request with `Authorization: Bearer <JWT>` + `X-Portal-JWT: true`
2. **nginx → Portal Backend**: Validate JWT (signature, expiration, audience)
3. **Portal Backend → nginx**: Return user context (200 OK) or 401
4. **nginx → MCP Service**: Forward request with user context
5. **MCP Service → n8n**: Execute operation and return result

**Benefits**:
- ✅ Existing CTERA AI flows unchanged (oauth2-proxy)
- ✅ New n8n flows work (Portal JWT)
- ✅ No changes to MCP Python service
- ✅ Centralized JWT validation in Portal Backend
- ✅ Single nginx configuration

**See Also**: 
- `NGINX_DUAL_AUTH_SOLUTION.md` - Detailed nginx configuration
- `OAUTH2_PROXY_INTEGRATION_ANALYSIS.md` - Design rationale

#### 4.2.5 MCP Endpoint (Backend - Python/Java)

**Endpoint** (`/_SRV/MCP/mcp`)
   - JSON-RPC 2.0 handler
   - Receives authenticated requests (via nginx + Portal Backend)
   - Tool routing and execution (18 filesystem operations)
   - Returns structured success/error responses

**Technology Stack**:
- Python 3.x (MCP implementation)
- Java authentication layer (Portal JWT framework)
- CTERA Portal Python SDK
- Envoy (existing routing infrastructure)

### 4.3 Data Models

#### 4.3.1 JWT Token Structure (Phase 0)

**Standard JWT Claims (RFC 7519)**:
```json
{
  "sub": "user@company.com",        // Subject (user identifier)
  "iss": "ctera-portal",             // Issuer (constant)
  "aud": "mcp",                      // Audience (mcp, share, api, wopi, etc.)
  "iat": 1703721600,                 // Issued at (Unix timestamp)
  "exp": 1709081600,                 // Expires at (60 days later, Phase 0)
  
  // Custom claims
  "uid": 12345,                      // User UID (Portal user ID)
  "tenant": "acme-corp",             // Tenant identifier (multi-tenant)
  "name": "John Doe"                 // User display name
}
```

**Phase 0 Characteristics**:
- Expiration: 60-90 days (configurable)
- Algorithm: HMAC-SHA256 (same as WOPI)
- Secret: Derived from master key using `HMAC-SHA256(masterKey, audience)`
- No `jti` (no revocation in Phase 0)
- No `scope` (audience-only authorization)
- Stateless (no database storage)

**Future Phase 2 - Short-lived Access Tokens**:
```json
{
  "sub": "user@company.com",
  "iss": "ctera-portal",
  "aud": "mcp",
  "iat": 1703721600,
  "exp": 1703725200,                 // 1 hour expiry
  "jti": "uuid-v4-access-token-id",  // For revocation
  "scope": "filesystem:read filesystem:write",  // Fine-grained scopes
  "uid": 12345,
  "tenant": "acme-corp",
  "type": "access"
}
```

#### 4.3.2 Refresh Token (Future Phase 2 - Opaque)

**Table**: `portal_refresh_tokens` (generic, not MCP-specific)

```java
class PortalRefreshToken {
    String id;                    // Token ID (UUID, primary key)
    String tokenHash;             // SHA-256 hash of refresh token
    Long ownerUid;                // Portal user UID
    String audience;              // "mcp", "api", "mobile", etc.
    String scopes;                // Comma-separated scopes
    Date createdAt;               // Creation timestamp
    Date expiresAt;               // Expiration (90 days)
    Date lastUsed;                // Last refresh timestamp
    Boolean revoked;              // Revocation flag
    Date revokedAt;               // Revocation timestamp
    String userAgent;             // Client user agent
    String ipAddress;             // Client IP address
    String name;                  // User-defined token name
}
```

#### 4.3.3 MCP Request/Response

**Request (JSON-RPC 2.0)**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "filesystem_write_file",
    "arguments": {
      "path": "/GlobalFolders/inbox/file.pdf",
      "content": "base64_encoded_content",
      "overwrite": true,
      "createParents": true
    }
  },
  "id": 1
}
```

**Response (Success)**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"success\": true, \"operation\": \"writeFile\", \"path\": \"/GlobalFolders/inbox/file.pdf\"}"
    }]
  },
  "id": 1
}
```

**Response (Error)**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"success\": false, \"operation\": \"writeFile\", \"path\": \"/GlobalFolders/inbox/file.pdf\", \"errorCode\": \"PERMISSION_DENIED\", \"errorMessage\": \"User does not have write access to this folder.\"}"
    }]
  },
  "id": 1
}
```

### 4.4 Error Taxonomy

| Error Code | Description | HTTP Status | Retry? |
|------------|-------------|-------------|--------|
| `AUTH_FAILED` | JWT validation failed | 401 | No |
| `TOKEN_EXPIRED` | JWT has expired | 401 | No (regenerate) |
| `TOKEN_REVOKED` | Token has been revoked | 401 | No |
| `INVALID_CREDENTIALS` | Malformed token | 401 | No |
| `PORTAL_UNREACHABLE` | Cannot connect to Portal | 503 | Yes |
| `NOT_FOUND` | File/directory not found | 404 | No |
| `FILE_EXISTS` | File already exists (overwrite=false) | 409 | No |
| `DIR_NOT_EMPTY` | Directory has contents (recursive=false) | 409 | No |
| `PERMISSION_DENIED` | Insufficient permissions | 403 | No |
| `QUOTA_EXCEEDED` | Storage quota exceeded | 507 | No |
| `VERSION_NOT_FOUND` | Version ID/index invalid | 404 | No |
| `INVALID_PATH` | Path contains invalid characters | 400 | No |
| `CTERA_DIRECT_UNAVAILABLE` | Direct streaming not available | 503 | Yes (fallback) |
| `INTERNAL_ERROR` | Unexpected server error | 500 | Yes |

### 4.5 Security Considerations

#### 4.5.1 JWT Secret Management

- **Generation**: 256-bit cryptographically secure random secret
- **Storage**: Environment variable or encrypted configuration file
- **Rotation**: Support graceful rotation with dual-key validation
- **Access**: Restricted to MCP server process only

#### 4.5.2 Token Security

- **Transmission**: HTTPS only, never in logs
- **Storage (Portal)**: Token ID only, no raw tokens
- **Storage (n8n)**: n8n's credential encryption
- **Expiration**: Enforce short-to-medium lifetimes (default 90 days)
- **Revocation**: Immediate via in-memory blocklist + DB

#### 4.5.3 Path Validation

```python
def validate_path(path: str) -> bool:
    # Prevent path traversal
    if '..' in path or path.startswith('/..'):
        raise InvalidPathError("Path traversal not allowed")
    
    # Prevent absolute paths outside allowed base
    if not path.startswith('/GlobalFolders/') and not path.startswith('/Users/'):
        raise InvalidPathError("Path must start with /GlobalFolders/ or /Users/")
    
    return True
```

### 4.6 MCP Tool Definitions

#### Example: Write File

```python
{
  "name": "filesystem_write_file",
  "description": "Write content to a file in CTERA Portal storage",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Full path to the file (e.g., /GlobalFolders/inbox/file.pdf)"
      },
      "content": {
        "type": "string",
        "description": "File content (base64-encoded for binary)"
      },
      "overwrite": {
        "type": "boolean",
        "default": false,
        "description": "Whether to overwrite existing file"
      },
      "createParents": {
        "type": "boolean",
        "default": false,
        "description": "Whether to create parent directories if missing"
      }
    },
    "required": ["path", "content"]
  }
}
```

**Complete list of 18 tools**:
1. `filesystem_write_file`
2. `filesystem_read_file`
3. `filesystem_delete_file`
4. `filesystem_create_directory`
5. `filesystem_delete_directory`
6. `filesystem_list_directory`
7. `filesystem_get_properties`
8. `filesystem_list_versions`
9. `filesystem_read_version`
10. `filesystem_restore_version`
11. `filesystem_copy_file`
12. `filesystem_move_file`
13. `filesystem_create_public_link`
14. `filesystem_get_permalink`

---

## 5. User Experience

### 5.1 Token Generation Flow

1. User logs into CTERA Portal (ENTRA SSO)
2. Navigate to **Settings → MCP Tokens**
3. Click **"Generate New Token"**
4. Configure:
   - Name: "Production n8n Workflows"
   - Expiration: 90 days
   - Scope: [filesystem, metadata]
5. Click **Generate**
6. Portal displays token (shown once):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGNvbXBh...
   ```
7. User copies token
8. Token added to list with metadata (name, created date, expires date)

### 5.2 n8n Credential Setup

1. In n8n, add new credential
2. Select **"CTERA Portal MCP"**
3. Fill in fields:
   - **MCP Server URL**: `https://portal.company.com/mcp/filesystem`
   - **Bearer Token (JWT)**: Paste token from Portal
   - **Ignore SSL Issues**: false (or true for self-signed certs)
4. Click **"Save"**
5. n8n validates token by calling test endpoint

### 5.3 Workflow Example: Daily File Organization

**Scenario**: Every day at midnight, move all files from `/GlobalFolders/inbox` to daily subdirectories based on modification date.

**Workflow**:
```
[Schedule Trigger: Daily 00:00]
    ↓
[CTERA Filesystem: List Directory]
  - Path: /GlobalFolders/inbox
  - Recursive: false
    ↓
[Function: Compute Target Path]
  - Extract modifiedAt date
  - Generate target: /GlobalFolders/inbox/YYYY-MM-DD/filename
    ↓
[CTERA Filesystem: Move File]
  - Source: {{ $json.path }}
  - Target: {{ $json.targetPath }}
  - Create Parents: true
    ↓
[IF: Check Success]
  - success == true → [Send Slack: Success]
  - success == false → [Send Email: Error Alert]
```

### 5.4 Error Handling Example

**Scenario**: Attempt to delete non-empty directory

**Workflow**:
```
[CTERA Filesystem: Delete Directory]
  - Path: /GlobalFolders/archive/2024
  - Recursive: false
    ↓
[IF Node: Check Error]
  - errorCode == "DIR_NOT_EMPTY" → [Retry with Recursive: true]
  - errorCode == "PERMISSION_DENIED" → [Send Admin Alert]
  - errorCode == null (success) → [Continue Workflow]
```

---

## 6. Implementation Plan

### 6.1 Development Phases

#### Phase 1: Generic JWT Framework (Week 1)
- [ ] Design generic JWT framework (`com.ctera.auth.jwt` package)
- [ ] Implement `JwtService`, `JwtGenerator`, `JwtValidator`
- [ ] Implement `RefreshTokenManager` with database schema
- [ ] Implement `JwtAuthorizationBearerValidator` (plugs into existing chain)
- [ ] Implement JWT secret management (`JwtSecretManager`)
- [ ] Create token revocation manager with in-memory cache
- [ ] Add to existing bearer authentication valve
- [ ] Unit tests for JWT framework

#### Phase 2: Token Management API & UI (Week 1-2)
- [ ] Implement generic token REST API (`/api/auth/tokens/*`)
- [ ] Token generation endpoint (audience, scopes, lifetime)
- [ ] Token refresh endpoint
- [ ] Token revocation endpoint
- [ ] Token listing endpoint
- [ ] Create token management UI (Settings → API Tokens, not MCP-specific)
- [ ] Token generation form with audience selector
- [ ] Token list with filtering by audience
- [ ] Integration tests for token APIs

#### Phase 3: MCP Filesystem Operations (Week 2-3)
- [ ] Implement file CRUD operations (write, read, delete)
- [ ] Implement directory operations (create, delete, list)
- [ ] Implement metadata operations (get properties)
- [ ] Binary data handling
- [ ] MCP endpoint receives JWT via generic bearer auth
- [ ] Test with `TokenAudience.MCP`

#### Phase 4: n8n Node with Auto-Refresh (Week 3-4)
- [ ] Create n8n credentials (access + refresh tokens)
- [ ] Implement auto-refresh logic in n8n node
- [ ] Implement all 18 filesystem operations
- [ ] Implement versioning operations
- [ ] Implement copy/move operations
- [ ] Implement link generation operations
- [ ] Handle 401 errors with automatic token refresh

#### Phase 5: Testing & Documentation (Week 4-5)
- [ ] Unit tests for JWT framework
- [ ] Unit tests for all MCP operations
- [ ] Integration tests with Portal test instance
- [ ] End-to-end workflow tests with auto-refresh
- [ ] Security audit of JWT framework
- [ ] Documentation (generic JWT framework + n8n node)
- [ ] Migration guide for existing CTERA AI MCP users

#### Phase 6: Deployment & Future Planning (Week 5-6)
- [ ] npm package publishing
- [ ] Portal release with generic JWT framework
- [ ] Customer documentation
- [ ] Training materials
- [ ] Plan migration of CTERA AI MCP to new framework
- [ ] Document framework usage for future APIs (Portal API v2, Mobile)

### 6.2 Dependencies

| Dependency | Owner | Status | Notes |
|------------|-------|--------|-------|
| MCP infrastructure in Portal | Backend Team | ⏳ Unknown | **Need to verify in correct worktree** |
| auth0/java-jwt library | Backend Team | ⏳ Pending | Add to pom.xml |
| JWT secret generation/storage | DevOps | ⏳ Pending | Portal variables or environment |
| Generic token management UI | Frontend Team | ⏳ Pending | Settings → API Tokens (not MCP-specific) |
| Bearer authentication valve | Backend Team | ✅ Complete | Already exists, just add JWT validator |
| n8n node repository access | DevOps | ✅ Complete | SAML configured |
| Portal test instance | QA Team | ✅ Complete | Available |
| npm publishing access | DevOps | ⏳ Pending | Setup @ctera org |
| Access to correct worktree/branch | Dev Team | ⏳ **CRITICAL** | Need to see actual MCP implementation |

### 6.3 Timeline

**Total Duration**: 5-6 weeks

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| Design Review | Week 0 | Approved feature spec |
| Auth Complete | Week 1 | Working JWT auth |
| Core Operations | Week 3 | File & dir operations working |
| Feature Complete | Week 4 | All 18 operations implemented |
| Testing Complete | Week 5 | All tests passing |
| Release | Week 6 | npm package published |

---

## 7. Testing Strategy

### 7.1 Unit Tests

- Token generation logic
- JWT validation logic
- Path validation
- Error code mapping
- Each MCP tool in isolation

### 7.2 Integration Tests

- End-to-end operation tests against Portal
- Authentication flows
- Binary file upload/download
- Large file handling (streaming)
- Concurrent operations

### 7.3 Security Tests

- Invalid token rejection
- Expired token rejection
- Revoked token rejection
- Path traversal attack prevention
- Permission enforcement
- Token scope validation

### 7.4 Performance Tests

- File upload/download throughput
- Large directory listing (10k+ files)
- Concurrent workflow execution
- CTERA Direct performance

### 7.5 User Acceptance Tests

- Token generation workflow
- n8n credential setup
- Demo workflows from Confluence spec:
  - Hourly file sorting
  - CSV generation and storage

---

## 8. Documentation

### 8.1 User Documentation

- **README.md**: Overview, installation, quick start
- **Operations Reference**: Detailed parameter descriptions
- **Example Workflows**: Common use cases with screenshots
- **Error Handling Guide**: Error codes and resolution steps
- **Authentication Guide**: Token generation and setup

### 8.2 Developer Documentation

- **Architecture Overview**: System design and components
- **API Reference**: MCP tool definitions
- **Contributing Guide**: How to extend/modify the node
- **Testing Guide**: Running tests locally

### 8.3 Admin Documentation

- **Deployment Guide**: Portal configuration for MCP
- **Security Guide**: JWT secret management, token rotation
- **Monitoring Guide**: Audit logs, token usage tracking
- **Troubleshooting Guide**: Common issues and solutions

---

## 9. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| JWT secret compromise | Low | High | Secure storage, rotation support, monitoring |
| Token leakage | Medium | High | Short expiration, immediate revocation capability |
| Performance bottleneck with large files | Medium | Medium | Streaming implementation, CTERA Direct support |
| MCP protocol changes | Low | Medium | Version pinning, compatibility layer |
| Portal API changes | Low | High | Abstraction layer, version compatibility checks |
| npm package maintenance | Medium | Low | Clear ownership, deprecation policy |

---

## 10. Success Metrics

### 10.1 Adoption Metrics

- **Target**: 50+ active users in first 6 months
- npm package downloads per month
- Number of generated tokens
- Token usage frequency

### 10.2 Performance Metrics

- Average operation latency: <500ms
- File upload/download throughput: >50 MB/s
- Token validation latency: <100ms
- Error rate: <1%

### 10.3 Quality Metrics

- Test coverage: >80%
- Security vulnerabilities: 0 critical, 0 high
- Customer-reported bugs: <5 in first 3 months
- Documentation completeness: 100%

---

## 11. Architectural Decisions Summary

This section documents key architectural decisions made during the design phase.

### 11.1 JWT Framework - Extract from WOPI

**Decision**: Extract JWT code from `WOPIUtils.java` into generic `com.ctera.auth.jwt` framework.

**Rationale**:
- ✅ WOPI JWT code is **battle-tested** and production-proven
- ✅ Already uses **jose4j** library (in classpath)
- ✅ Already uses **HMAC-SHA256** with master key derivation
- ✅ Signature validation and expiration checking already implemented
- ✅ Security patterns already reviewed and approved
- ✅ Avoids reinventing the wheel

**Implementation Plan**: See `WOPI_CODE_EXTRACTION_PLAN.md`

---

### 11.2 JWT Library - jose4j (Not auth0/java-jwt)

**Decision**: Use `jose4j` library for JWT operations.

**Options Considered**:
- ❌ **auth0/java-jwt**: Popular but requires new dependency
- ✅ **jose4j**: Already in classpath (used by WOPI), proven in production

**Rationale**:
- Already in classpath (no new dependency)
- Used by existing WOPI implementation
- Supports HMAC-SHA256 (same as WOPI)
- Well-documented and maintained
- Security-audited

**References**:
- WOPI usage: `WOPIUtils.java` lines 83-145
- Library: [bitbucket.org/b_c/jose4j](https://bitbucket.org/b_c/jose4j/wiki/Home)

---

### 11.3 Implementation Strategy - Phased Approach

**Decision**: Phase 0 (JWT-only, 60-90 days) → Phase 2 (Add refresh tokens, 1h access + 90d refresh)

**Options Considered**:
- ❌ **Option A**: Full OAuth2 implementation immediately (access + refresh tokens)
- ✅ **Option B**: Start simple (long-lived JWT), add refresh tokens later

**Rationale**:
- Faster time to market (Phase 0: 2-3 weeks vs Phase 1+2: 6-8 weeks)
- Lower complexity initially (stateless JWT, no database)
- Existing CTERA AI MCP uses similar pattern (long-lived bearerToken from `/api/tokens/generate`)
- Refresh tokens can be added without breaking existing workflows
- n8n users can start building automations immediately

**Phase 0** (Current):
- 60-90 day JWT tokens
- Manual refresh (user regenerates token in Portal UI)
- Stateless (no database)
- HMAC-SHA256 signature

**Phase 2** (Future):
- 1 hour access tokens + 90 day refresh tokens
- Automatic refresh in n8n node
- Database for refresh token storage
- Revocation support

---

### 11.4 Dual Authentication Path - nginx Routing

**Decision**: Route MCP requests based on `X-Portal-JWT` header: Portal JWT → Portal Backend, otherwise → oauth2-proxy.

**Problem**: MCP service uses oauth2-proxy (IdP-based, interactive) which doesn't work for non-interactive n8n workflows.

**Options Considered**:
- ❌ **Option A**: Replace oauth2-proxy with Portal JWT (breaks CTERA AI)
- ❌ **Option B**: Create separate MCP endpoint for n8n (code duplication)
- ✅ **Option C**: nginx routing based on `X-Portal-JWT` header (dual path)

**Rationale**:
- ✅ Existing CTERA AI flows unchanged (oauth2-proxy)
- ✅ New n8n flows work (Portal JWT)
- ✅ No changes to MCP Python service
- ✅ Single nginx configuration
- ✅ Centralized JWT validation in Portal Backend

**Implementation**: See `NGINX_DUAL_AUTH_SOLUTION.md`

**nginx Configuration**:
```nginx
location = /_SRV/MCP/mcp {
    # Check for Portal JWT signal
    if ($http_x_portal_jwt = "true") {
        auth_request /auth/portal-jwt;  # Portal Backend validation
        proxy_pass http://tomcat/_SRV/MCP/mcp;
        break;
    }
    
    # Default: oauth2-proxy (CTERA AI)
    auth_request /auth;
    proxy_pass http://envoy/_SRV/MCP/mcp/;
}
```

---

### 11.5 Scope Granularity - Audience-Only (Phase 0)

**Decision**: Use audience-only authorization initially (e.g., `aud: "mcp"`), defer fine-grained scopes to Phase 2.

**Options Considered**:
- ❌ **Option A**: Fine-grained scopes from day 1 (e.g., `filesystem:read`, `filesystem:write`)
- ✅ **Option B**: Audience-only initially, add scopes later

**Rationale**:
- Simpler implementation (no scope parsing, no scope enforcement)
- Existing CTERA AI MCP doesn't use scopes
- n8n workflows typically need full filesystem access (read + write)
- Scopes can be added in Phase 2 without breaking existing tokens
- WOPI uses audience-only pattern successfully

**Audience Values**:
- `wopi` - Office Online (existing)
- `mcp` - n8n automation (new)
- `share` - Portal ↔ Gateway (new)
- `api` - Portal REST API v2 (future)
- `mobile` - Mobile apps (future)

---

### 11.6 Secret Management - Master Key Derivation + Shared Secrets

**Decision**: Support two secret types:
1. **Derived Secrets** (Portal-only): `HMAC-SHA256(masterKey, audience)` → per-audience secret
2. **Shared Secrets** (Portal ↔ Gateway): Pre-configured shared keys

**Rationale**:
- Derived secrets: Reuse WOPI pattern, single master key, automatic per-audience isolation
- Shared secrets: Support Portal ↔ Gateway communication (share management)
- Both patterns coexist via `SecretProvider` interface

**Configuration**: See `PORTAL_CONFIGURATION_SHARED_SECRETS.md`

**Derived Secret Example** (WOPI, MCP, API):
```java
// Master key: abc123...
// Audience: "mcp"
// Derived secret: HMAC-SHA256("abc123...", "mcp") = def456...
```

**Shared Secret Example** (Share Management):
```java
// Portal config: share_secret = xyz789...
// Gateway config: share_secret = xyz789... (same)
// Both validate using xyz789... (no derivation)
```

---

### 11.7 TokenAudience Enum - Extensible Design

**Decision**: Create `TokenAudience` enum with values: `WOPI`, `MCP`, `SHARE`, `API`, `MOBILE`, `INTEGRATION`, `INTERNAL`.

**Rationale**:
- Type-safe audience values (compile-time checking)
- Self-documenting (enum names explain use case)
- Extensible (add new audiences without breaking existing code)
- WOPI migration path (add `WOPI` to enum, refactor `WOPIUtils`)

**Implementation**:
```java
public enum TokenAudience {
    WOPI("wopi"),           // Office Online (existing)
    MCP("mcp"),             // n8n automation (new)
    SHARE("share"),         // Portal ↔ Gateway (new)
    API("api"),             // Portal REST API v2 (future)
    MOBILE("mobile"),       // Mobile apps (future)
    INTEGRATION("integration"), // Third-party integrations (future)
    INTERNAL("internal");   // Service-to-service (future)
    
    private final String value;
    // ...
}
```

---

### 11.8 Backward Compatibility - WOPI Migration

**Decision**: Migrate WOPI to use generic framework while maintaining backward compatibility.

**Approach**:
1. Create generic framework (extract from WOPI)
2. Update `WOPIUtils` to delegate to framework
3. Keep WOPI API unchanged (no breaking changes)
4. All existing WOPI tokens continue working

**Example**:
```java
// Before (WOPI-specific)
String token = WOPIUtils.generateJWTAccessToken(accessTokenData, key);

// After (delegates to generic framework)
String token = jwtService.generateToken(
    TokenAudience.WOPI,
    subject,
    claims,
    null  // WOPI doesn't use expiration currently
);
```

**Benefits**:
- ✅ No breaking changes to WOPI
- ✅ All existing WOPI code works
- ✅ All existing WOPI tests pass
- ✅ WOPI benefits from future framework improvements

---

## 12. Future Enhancements (Out of Scope for V1)

### 11.1 Filesystem Operations
1. **Wildcard/Globbing**: Batch operations on multiple files matching pattern
2. **File Search**: Search by name, content, metadata
3. **Trigger Node**: Webhook-based triggers on Portal events
4. **Cloud Folder Management**: Create/delete cloud folders and vaults
5. **Permanent Deletion**: Bypass trash, immediate permanent delete
6. **Archive Operations**: Compress/extract archives
7. **Quota Management**: Query and manage storage quotas

### 11.2 Generic JWT Framework Extensions
1. **Migrate CTERA AI MCP**: Move existing AI MCP to generic JWT framework
2. **Portal REST API v2**: Use `TokenAudience.PORTAL_API` for new REST API
3. **Mobile Apps**: Use `TokenAudience.MOBILE` for mobile authentication
4. **Third-Party Integrations**: Use `TokenAudience.INTEGRATION` for partners
5. **Service-to-Service**: Use `TokenAudience.INTERNAL` for internal services
6. **Advanced Permissions**: Fine-grained RBAC with JWT claims
7. **Token Analytics Dashboard**: Usage metrics, security alerts
8. **Token Rotation Policies**: Forced rotation, security compliance
9. **Multi-Tenant Isolation**: Tenant-specific token validation
10. **Audit Reporting**: Built-in workflow for audit log exports

---

## 12. References

### Design Documents (This Project)
- **`MCP_IMPLEMENTATION_FINDINGS.md`** - Initial MCP analysis and dilemmas
- **`OAUTH2_PROXY_INTEGRATION_ANALYSIS.md`** - Dual authentication path design
- **`NGINX_DUAL_AUTH_SOLUTION.md`** - nginx configuration for Portal JWT routing
- **`WOPI_CODE_EXTRACTION_PLAN.md`** - Step-by-step implementation plan (10.5 days)
- **`PORTAL_CONFIGURATION_SHARED_SECRETS.md`** - Secret management and configuration
- **`GENERIC_JWT_FRAMEWORK_DESIGN.md`** - Strategic analysis (WOPI extraction + share management)

### Specifications & Standards
- [n8n CTERA Filesystem Node Confluence Spec](https://cteranet.atlassian.net/wiki/spaces/IT/pages/4788355089/n8n+CTERA+Filesystem+Node)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519) - JSON Web Token standard
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749) - OAuth 2.0 authorization framework (refresh token pattern)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [jose4j Library Documentation](https://bitbucket.org/b_c/jose4j/wiki/Home)

### Existing Implementations
- [Existing ctera-n8n-nodes Repository](https://github.com/ctera/ctera-n8n-nodes) - CTERA AI MCP node (uses `/api/tokens/generate`)
  - **Pattern**: Long-lived bearerToken (not IdP-issued), similar to our Phase 0 approach
  - **File**: `credentials/CteraAiMcpApi.credentials.ts`
- [n8n Community Node Documentation](https://docs.n8n.io/integrations/community-nodes/)

### CTERA MCP Service Repositories
- [ctera-mcp-service](https://github.com/ctera/ctera-mcp-service) - MCP Python service implementation
- [ctera-mcp-base](https://github.com/ctera/ctera-mcp-base) - MCP Python service base code
- **Current Auth**: oauth2-proxy (IdP-based, interactive)
- **New Auth**: Dual path (oauth2-proxy + Portal JWT)

### Libraries & Tools
- **[jose4j](https://bitbucket.org/b_c/jose4j/wiki/Home)** - Java JWT library (CHOSEN - already in classpath, used by WOPI)
- [auth0/java-jwt](https://github.com/auth0/java-jwt) - Alternative JWT library (NOT chosen)
- [Google Guava Cache](https://github.com/google/guava) - For token caching (already in Portal)

### CTERA Backend Code References
- `Common/src/main/java/com/ctera/spring/shared/authorization/AuthenticationBearerAuthenticator.java` - Existing bearer auth valve
- `Common/src/main/java/com/ctera/spring/shared/authorization/validators/` - Validator chain pattern
- `Common/src/main/java/com/ctera/fileViewAndEdit/officeOnline/WOPIUtils.java` - **JWT pattern source** (WOPI, jose4j, HMAC-SHA256)
- `Common/src/main/java/com/ctera/web/microservices/McpHandler.java` - Existing MCP proxy handler
- `Common/src/main/java/com/ctera/microservices/mcp/McpToolsClient.java` - MCP tools client
- `Common/src/main/java/com/ctera/spring/shared/authorization/validators/OAuth2JwtBearerValidator.java` - External IdP validator (NOT suitable for Portal JWT)
- `Common/src/main/java/com/ctera/microservices/insight/auth/JwtManager.java` - Example of JWT usage (Insight)

---

## 13. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | | | |
| Backend Lead | | | |
| Security Lead | | | |
| DevOps Lead | | | |

---

## Appendix A: MCP Tool Reference

### Complete Tool List

1. **filesystem_write_file**: Upload file content
2. **filesystem_read_file**: Download file content
3. **filesystem_delete_file**: Remove file
4. **filesystem_create_directory**: Create new directory
5. **filesystem_delete_directory**: Remove directory
6. **filesystem_list_directory**: List directory contents
7. **filesystem_get_properties**: Get file/directory metadata
8. **filesystem_list_versions**: List file versions
9. **filesystem_read_version**: Download specific version
10. **filesystem_restore_version**: Restore file to previous version
11. **filesystem_copy_file**: Copy file to new location
12. **filesystem_move_file**: Move/rename file
13. **filesystem_create_public_link**: Generate public share link
14. **filesystem_get_permalink**: Get stable Portal permalink

---

## Appendix B: n8n Node Configuration Schema

```typescript
interface CteraFilesystemNodeProperties {
  // Credential
  credentials: 'cteraPortalMcp';
  
  // Operation selector
  operation: 'writeFile' | 'readFile' | 'deleteFile' | 
             'createDirectory' | 'deleteDirectory' | 'listDirectory' |
             'getProperties' | 'listVersions' | 'readVersion' | 'restoreVersion' |
             'copyFile' | 'moveFile' | 'createPublicLink' | 'getPermalink';
  
  // Common parameters
  path: string;  // File/directory path
  
  // Operation-specific parameters
  content?: string | Buffer;  // For write operations
  overwrite?: boolean;        // For write/copy/move
  createParents?: boolean;    // For write/move/createDirectory
  recursive?: boolean;        // For deleteDirectory/listDirectory
  version?: string | number;  // For version operations
  linkType?: 'rw' | 'upload' | 'ro';  // For createPublicLink
  expiration?: string | number;  // For createPublicLink
}
```

---

---

## 13. IMPORTANT NOTES FOR NEXT SESSION

### 13.1 Current State
- ⚠️ **Wrong Worktree**: Current session is on Backend 8.2 branch
- ⚠️ **MCP Implementation Not Visible**: Cannot see actual MCP implementation code
- ✅ **Spec Updated**: Feature spec updated with generic JWT framework approach
- ✅ **Architecture Decided**: OAuth2 refresh token pattern with generic `com.ctera.auth.jwt` framework

### 13.2 Critical Tasks for Next Session
1. **Switch to Correct Worktree/Branch** - Find where MCP implementation exists
2. **Examine Actual MCP Code** - Understand existing implementation
3. **Verify Token Generation** - How are tokens currently generated for CTERA AI MCP?
4. **Plan Migration** - Strategy to move from current auth to generic JWT framework
5. **Implement JWT Framework** - Start with `com.ctera.auth.jwt` package

### 13.3 Key Decisions Made
- ✅ **Use Refresh Token Pattern** (OAuth2 standard, bulletproof)
- ✅ **Generic Framework** (`com.ctera.auth.jwt`, not MCP-specific)
- ✅ **TokenAudience Enum** (MCP, PORTAL_API, MOBILE, INTEGRATION, INTERNAL)
- ✅ **Access Token**: JWT, 1 hour, HMAC-SHA256
- ✅ **Refresh Token**: Opaque, 90 days, hashed in DB
- ✅ **Auto-Refresh in n8n**: Transparent token refresh on 401 errors
- ✅ **Reusable for All APIs**: Not just MCP, future-proof

### 13.4 Open Questions
- ❓ Where is the actual MCP implementation? (need correct worktree)
- ❓ How are tokens currently generated for CTERA AI MCP?
- ❓ Is there existing JWT code we can leverage? (Found WOPI and Insight examples)
- ❓ What's the migration strategy for existing CTERA AI MCP users?

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-28 | Backend Team | Initial draft |
| 1.1 | 2024-12-28 | Backend Team | Updated with generic JWT framework approach |


