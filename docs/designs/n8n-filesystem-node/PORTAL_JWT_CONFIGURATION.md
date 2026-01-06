# Portal JWT Configuration

## Overview

The CTERA Portal backend must be configured to validate JWT Bearer tokens for API requests. This document describes the required configuration.

## Required Components

### 1. JWT Validation Filter

The Portal must have a servlet filter that:
- Intercepts requests to `/ServicesPortal/api/*`
- Validates `Authorization: Bearer <jwt>` headers
- Extracts user identity from JWT claims (`sub` or `preferred_username`)
- Sets up security context for downstream API handlers

### 2. JWT Secret Configuration

The Portal must use the same secret for JWT validation that was used to sign tokens:
- **Secret Source**: Derived from Portal's shared secret (same as MCP token generation)
- **Algorithm**: HMAC-SHA256
- **Claims**: `sub`, `aud`, `iss`, `exp`, `iat`

### 3. Filter Chain Configuration

The JWT validation filter must be placed in the filter chain:
- **Before**: Authentication filters (if any)
- **After**: Security filters
- **Scope**: `/ServicesPortal/api/*` endpoints

## Token Generation Endpoint

The Portal provides token generation at:
- **Endpoint**: `POST /ServicesPortal/v2/auth/token`
- **Authentication**: Requires session cookie (FORM login)
- **Request Body**:
  ```json
  {
    "audience": "mcp",
    "subject": "username"
  }
  ```
- **Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2026-03-30T15:19:05Z",
    "audience": "mcp"
  }
  ```

## Testing JWT Validation

Once configured, test with:

```bash
# 1. Get token
curl -sk -c cookies.txt -X POST "https://127.0.0.1:443/ServicesPortal/api/login?j_username=a1&j_password=password1!"
TOKEN=$(curl -sk -b cookies.txt -X POST "https://127.0.0.1:443/ServicesPortal/v2/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"audience":"mcp","subject":"a1"}' | jq -r '.token')

# 2. Test API call with JWT
curl -sk -X GET "https://127.0.0.1:443/ServicesPortal/api/v1/filesystem/list?path=/" \
  -H "Authorization: Bearer $TOKEN"
```

## Implementation Notes

- The JWT filter should extract user identity and set it in the security context
- API endpoints should trust the security context set by the JWT filter
- The filter should return 401 Unauthorized if JWT is invalid or expired
- The filter should return 403 Forbidden if user lacks required permissions

## Related Documentation

- `WOPI_CODE_EXTRACTION_PLAN.md` - How to extract and reuse JWT code from WOPI
- `NGINX_DUAL_AUTH_SOLUTION.md` - nginx routing for dual authentication paths
- `OAUTH2_PROXY_INTEGRATION_ANALYSIS.md` - OAuth2 integration design
