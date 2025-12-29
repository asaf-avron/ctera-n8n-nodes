# 🔍 MCP Implementation Findings & Critical Decisions

**Date**: December 28, 2024  
**Status**: ⚠️ REQUIRES USER DECISION BEFORE PROCEEDING

---

## 📊 WHAT I FOUND

### 1. **Existing OAuth2JwtBearerValidator** (⚠️ NOT SUITABLE for our needs)

**Location**: `Common/src/main/java/com/ctera/spring/shared/authorization/validators/OAuth2JwtBearerValidator.java`

**What it does**:
- ❌ **NO signature validation** - Just base64 decodes the JWT payload!
- ❌ **NO expiration checking** - No `exp` claim validation
- ❌ **NO issuer/audience validation** - No `iss`/`aud` checks
- ❌ **NO revocation checking** - Can't revoke tokens
- ✅ Uses RS256 (public/private key pairs)
- ✅ Looks up Portal user by `preferred_username` or `email` claim

**Purpose**: Integration with **external OAuth2/OIDC providers** (Azure AD, Google, etc.)

**Conclusion**: **NOT suitable for Portal-generated JWTs**. This is for trusting external identity providers, not for Portal to issue its own tokens.

---

### 2. **WOPI JWT Implementation** (✅ GOOD PATTERN to follow)

**Location**: `Common/src/main/java/com/ctera/fileViewAndEdit/officeOnline/WOPIUtils.java`

**What it does**:
- ✅ **Uses jose4j library** (already in classpath!)
- ✅ **Validates JWT signature** using HMAC-SHA256
- ✅ **Checks expiration** automatically
- ✅ **Validates required claims** (subject, etc.)
- ✅ Uses `HmacKey` for shared secret
- ✅ Has `JwtConsumer` for validation

**Code snippet**:
```java
Key hmacKey = new HmacKey(key.getBytes("UTF-8"));
JwtConsumer jwtConsumer = new JwtConsumerBuilder()
    .setRequireSubject() 
    .setVerificationKey(hmacKey) 
    .build(); 
JwtClaims jwtClaims = jwtConsumer.processToClaims(accessToken);
```

**Purpose**: WOPI file editing authentication (Office Online)

**Conclusion**: **Perfect pattern!** We should use **jose4j** (not auth0/java-jwt) and follow WOPI's implementation style.

---

### 3. **MCP Service Architecture**

**What I found**:
- MCP is a **microservice** managed via Consul (like Insight, Messaging, etc.)
- MCP runs on localhost:80 behind Envoy proxy
- Endpoints like `/_SRV/MCP/tools/` for tool listing
- Java backend (`McpHandler`, `McpToolsClient`) manages MCP lifecycle
- Actual MCP implementation is **likely Python** (separate service, not in this repo)

**Current Authentication**:
- MCP currently uses the **same bearer authentication valve** as other APIs
- Likely uses existing validators (ApiKey or Nomad)
- **No dedicated MCP JWT generation exists yet**

---

### 4. **Bearer Authentication Infrastructure**

**Location**: `Common/src/main/java/com/ctera/spring/shared/authorization/AuthenticationBearerAuthenticator.java`

**How it works**:
```
Request with "Authorization: Bearer <token>"
    ↓
AuthenticationBearerAuthenticator (valve)
    ↓
Tries validators in chain:
    1. NomadAuthorizationBearerValidator
    2. OAuth2JwtBearerValidator (external OIDC)
    3. ApiKeyAuthorizationBearerValidator
    ↓
First validator that returns UserPrincipal wins
    ↓
Request authenticated, cached for 1 minute
```

**Our approach**: Add `JwtAuthorizationBearerValidator` (new, generic) to this chain.

---

## ⚠️ CRITICAL DILEMMAS - NEED YOUR DECISION

### **Dilemma #1: JWT Library Choice**

**Option A: Use jose4j (RECOMMENDED)**
- ✅ Already in classpath (used by WOPI)
- ✅ Battle-tested in Portal (Office Online integration)
- ✅ Full featured (signing, validation, expiration)
- ✅ No new dependencies

**Option B: Use auth0/java-jwt (as in current spec)**
- ⚠️ Need to add new dependency to pom.xml
- ✅ Simpler API for basic JWT operations
- ⚠️ Adds another library to maintain

**My Recommendation**: **Use jose4j** - it's already there, proven, and feature-complete.

❓ **YOUR DECISION**: Which library should we use?

---

### **Dilemma #2: Refresh Token Implementation Strategy**

The spec designs a full OAuth2 refresh token flow with:
- Access tokens (JWT, 1 hour)
- Refresh tokens (opaque, 90 days)
- Auto-refresh in n8n node
- Database table for refresh tokens
- Token revocation

**Option A: Build Full Refresh Token Framework (as designed)**
- ✅ Industry standard (OAuth2)
- ✅ Most secure and user-friendly
- ✅ Reusable for all Portal APIs
- ⚠️ More complex (6-week timeline)
- ⚠️ Requires DB schema changes
- ⚠️ Requires new REST API endpoints
- ⚠️ Requires Portal UI changes

**Option B: Start Simple - JWT Only (Phase 1)**
- ✅ Faster to implement (2-3 weeks)
- ✅ Get n8n node working sooner
- ✅ Proves the approach
- ⚠️ Less user-friendly (manual token regeneration)
- ⚠️ Still need long-lived JWTs (60-90 days)
- ✅ Can add refresh tokens later (Phase 2)

**Option C: Use Existing API Keys (Simplest)**
- ✅ Already implemented (`ApiKeyAuthorizationBearerValidator`)
- ✅ No new code needed
- ✅ Works today
- ❌ No expiration (security issue)
- ❌ No scopes/audience
- ❌ Not JWT-based
- ❌ Not generic/reusable

**My Recommendation**: **Option B** (JWT-only Phase 1, refresh tokens Phase 2)
- Gets us to market faster
- Proves the generic JWT framework concept
- Allows iterative improvements
- Still achieves main goal (n8n automation)

❓ **YOUR DECISION**: Which implementation strategy?

---

### **Dilemma #3: MCP Python Service Location**

I **could NOT find** the actual MCP Python service code in this repo.

**Possible explanations**:
1. MCP service is in a **separate repository** (like `ctera/mcp-service`)
2. MCP service is **deployed as a container** (built elsewhere)
3. MCP service is part of **another Backend component** I haven't found yet
4. MCP is still under development and not merged to dev branch

**Impact on n8n implementation**:
- n8n node will call `/mcp/filesystem` endpoint
- That endpoint needs to:
  1. Accept JWT bearer tokens (Java side - we're building this)
  2. Implement 18 filesystem operations (Python side - **need to verify this exists**)
  3. Return JSON-RPC 2.0 responses

❓ **YOUR DECISION**: 
1. Do you know where the MCP Python service code is?
2. Does the MCP filesystem endpoint already exist, or do we need to build it too?
3. Is CTERA AI MCP already deployed and working? (That would prove the infrastructure exists)

---

### **Dilemma #4: Audience/Scope Granularity**

The spec proposes:
- `TokenAudience` enum: MCP, PORTAL_API, MOBILE, INTEGRATION, INTERNAL
- Scope strings: "filesystem read write metadata"

**Question**: Do we need **fine-grained scopes** now, or just audience?

**Option A: Audience Only (Simple)**
```json
{
  "aud": "mcp",
  // No scopes - all MCP operations allowed
}
```

**Option B: Audience + Scopes (Complex)**
```json
{
  "aud": "mcp",
  "scope": "filesystem:read filesystem:write filesystem:delete"
}
```

**My Recommendation**: **Start with Audience Only**, add scopes in Phase 2 when we understand actual permission requirements better.

❓ **YOUR DECISION**: Fine-grained scopes now, or later?

---

## 📝 PROPOSED CHANGES TO SPEC

Based on findings, I propose these adjustments:

### ✏️ Change #1: JWT Library
**From**: auth0/java-jwt  
**To**: jose4j (already in classpath)

### ✏️ Change #2: Implementation Phases
**Add Phase 0**: JWT-only implementation (no refresh tokens)
- JWT with 60-90 day expiration
- Manual regeneration when expired
- Gets n8n node working ASAP

**Phase 1** (original): Add refresh token support
- OAuth2 refresh token flow
- Auto-refresh in n8n
- Database schema
- Token management UI

### ✏️ Change #3: Technology Stack
**Section 4.2.1** - Replace references to:
```diff
- auth0/java-jwt library for JWT operations
+ jose4j library for JWT operations (already in Portal - see WOPIUtils)
```

### ✏️ Change #4: Dependencies Table
```diff
- || auth0/java-jwt library | Backend Team | ⏳ Pending | Add to pom.xml |
+ || jose4j library | Backend Team | ✅ Complete | Already in classpath (WOPI) |
```

### ✏️ Change #5: Add "Current State" Section
Document existing JWT usage:
- OAuth2JwtBearerValidator (external OIDC only)
- WOPIUtils (best practice example)
- Insight integration (external Keycloak)

---

## 🚦 NEXT STEPS (After Your Decisions)

Once you decide on the dilemmas:

1. **Update spec** with agreed approach
2. **Find MCP Python service** (or confirm where it is)
3. **Start Phase 0**: Generic JWT framework
   - JwtService (main entry point)
   - JwtGenerator (using jose4j)
   - JwtValidator (using jose4j, following WOPIUtils pattern)
   - JwtAuthorizationBearerValidator (plugs into bearer auth chain)
4. **Create JWT generation endpoint**: `POST /api/auth/tokens/generate`
5. **Test with existing MCP endpoints** (if they exist)
6. **Build n8n node** with manual token refresh

---

## 🎯 MY RECOMMENDATIONS SUMMARY

| Dilemma | Recommendation | Rationale |
|---------|---------------|-----------|
| JWT Library | **jose4j** | Already in codebase, proven by WOPI |
| Implementation | **Phase 0: JWT-only first** | Faster to market, iterative approach |
| MCP Location | **You tell me** | Need to know where Python code is |
| Scopes | **Audience only, scopes later** | YAGNI - add when actually needed |

---

## ❓ QUESTIONS FOR YOU

1. **JWT Library**: jose4j or auth0/java-jwt?
2. **Implementation**: Full refresh tokens now, or JWT-only Phase 0?
3. **MCP Service**: Where is the Python MCP implementation?
4. **Scopes**: Fine-grained permissions now or later?
5. **Timeline**: Is 2-3 weeks (JWT-only) acceptable vs 6 weeks (full OAuth2)?

**Please review and let me know your decisions.** Once I have your input, I'll update the spec accordingly and we can start implementation.

---

## 📋 FILES ANALYZED

- ✅ `Common/src/main/java/com/ctera/spring/shared/authorization/validators/OAuth2JwtBearerValidator.java`
- ✅ `Common/src/main/java/com/ctera/spring/shared/authorization/validators/ApiKeyAuthorizationBearerValidator.java`
- ✅ `Common/src/main/java/com/ctera/spring/shared/authorization/validators/AuthorizationBearerValidator.java`
- ✅ `Common/src/main/java/com/ctera/spring/shared/authorization/AuthenticationBearerAuthenticator.java`
- ✅ `Common/src/main/java/com/ctera/fileViewAndEdit/officeOnline/WOPIUtils.java`
- ✅ `Common/src/main/java/com/ctera/microservices/insight/auth/JwtManager.java`
- ✅ `Common/src/main/java/com/ctera/web/microservices/McpHandler.java`
- ✅ `Common/src/main/java/com/ctera/microservices/mcp/McpToolsClient.java`
- ✅ `Common/src/main/java/com/ctera/web/microservices/MicroserviceEnum.java`
- ✅ `generate_jwt_interactive.py` (testing tool for OAuth2JwtBearerValidator)


