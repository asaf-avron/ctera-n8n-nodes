# Tasks to Create in Jira for Epic SP-28789

**Epic**: [SP-28789 - n8n CTERA Filesystem Node](https://cteranet.atlassian.net/browse/SP-28789)

---

## 📋 Quick Summary

**15 tasks** organized into **4 parallel tracks**:
- **Track 1**: Generic JWT Framework (8 tasks, 10 days)
- **Track 2**: Portal Configuration & nginx (3 tasks, 3 days)
- **Track 3**: n8n Node Implementation (5 tasks, 5 days)
- **Track 4**: Testing & Documentation (3 tasks, 3 days)

**Total Timeline**: ~3.5 weeks (17 business days)

---

## 🎯 Track 1: Generic JWT Framework (Backend - Java)

### **SP-XXXX: Create JWT Framework Package Structure**
- **Type**: Task
- **Story Points**: 2
- **Duration**: 1 day
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Description**: Create package structure and core interfaces
- **Acceptance Criteria**:
  - Package `com.ctera.auth.jwt` created with subpackages
  - `TokenAudience` enum implemented (7 values)
  - `SecretProvider` interface defined
  - `JwtClaims` model class created
  - Basic exception classes created

---

### **SP-XXXX: Extract Secret Derivation from WOPI**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 1 day
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Depends On**: JWT Framework Package Structure
- **Description**: Extract secret derivation logic from WOPIUtils
- **Acceptance Criteria**:
  - `SecretDerivation.deriveSecret()` implemented with HMAC-SHA256
  - `PortalSecretProvider` implemented
  - `SharedSecretProvider` implemented
  - Unit tests pass with WOPI reference values

---

### **SP-XXXX: Extract JWT Generation from WOPI**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 1.5 days
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Depends On**: Extract Secret Derivation
- **Description**: Extract JWT generation logic from WOPIUtils
- **Acceptance Criteria**:
  - `JwtGenerator.generate()` implemented using jose4j
  - HMAC-SHA256 signature algorithm
  - Supports custom claims and configurable expiration
  - Unit tests generate valid JWTs

---

### **SP-XXXX: Extract JWT Validation from WOPI**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 1.5 days
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Depends On**: Extract Secret Derivation
- **Description**: Extract JWT validation logic from WOPIUtils
- **Acceptance Criteria**:
  - `JwtValidator.validate()` implemented using jose4j
  - Signature, expiration, and audience validation enforced
  - Specific exceptions for expired/invalid tokens
  - Unit tests validate WOPI-generated tokens

---

### **SP-XXXX: Create JwtService (Main Entry Point)**
- **Type**: Task
- **Story Points**: 2
- **Duration**: 0.5 days
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Depends On**: Extract JWT Generation, Extract JWT Validation
- **Description**: Create high-level JwtService with clean API
- **Acceptance Criteria**:
  - `JwtService.generateToken()` implemented
  - `JwtService.validateToken()` implemented
  - Integration tests pass (generate → validate)

---

### **SP-XXXX: Update WOPI to Use Generic Framework**
- **Type**: Task
- **Story Points**: 5
- **Duration**: 2 days
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Depends On**: Create JwtService
- **Description**: Refactor WOPIUtils to delegate to generic JWT framework
- **Acceptance Criteria**:
  - WOPIUtils delegates to JwtService
  - All existing WOPI unit tests pass unchanged
  - WOPI token format unchanged
  - No breaking changes to WOPI API
  - Office Online integration still works

---

### **SP-XXXX: Implement JwtAuthorizationBearerValidator**
- **Type**: Task
- **Story Points**: 5
- **Duration**: 2 days
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Depends On**: Create JwtService
- **Description**: Create Spring Security bearer validator for Portal JWTs
- **Acceptance Criteria**:
  - `JwtAuthorizationBearerValidator` implements `AuthorizationBearerValidator`
  - Validates JWT using JwtService
  - Returns UserPrincipal from validated claims
  - Integration tests with Spring Security context

---

### **SP-XXXX: JWT Framework Testing & Documentation**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 2 days
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Depends On**: Update WOPI, JwtAuthorizationBearerValidator
- **Description**: Comprehensive testing and documentation
- **Acceptance Criteria**:
  - Unit test coverage >80%
  - Integration tests for all audiences
  - Security test cases
  - JavaDoc for all public methods
  - README for framework usage

---

## 🎯 Track 2: Portal Configuration & nginx (DevOps/Backend)

### **SP-XXXX: Configure Portal Secret Management**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 1 day
- **Component**: REST API
- **Epic Link**: SP-28789
- **Description**: Set up Portal configuration for master key and shared secrets
- **Acceptance Criteria**:
  - SystemSettings master key configured
  - SystemSettings share secret configured
  - Secrets generated using openssl
  - PortalConfiguration methods implemented
  - Secrets not logged
  - Migration script created if needed

---

### **SP-XXXX: Implement nginx Dual Authentication Path**
- **Type**: Task
- **Story Points**: 5
- **Duration**: 2 days
- **Component**: Portal MCP
- **Epic Link**: SP-28789
- **Description**: Configure nginx routing based on X-Portal-JWT header
- **Acceptance Criteria**:
  - nginx location block updated
  - Routes to Portal Backend if X-Portal-JWT header present
  - Routes to oauth2-proxy if header absent
  - Portal JWT validation endpoint created
  - Integration tests for both paths
  - No impact to existing CTERA AI flows

---

### **SP-XXXX: Create Portal JWT Token Generation API**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 1 day
- **Component**: REST API
- **Epic Link**: SP-28789
- **Depends On**: Create JwtService, Configure Portal Secret Management
- **Description**: Create REST API for generating Portal JWTs
- **Acceptance Criteria**:
  - POST /api/auth/tokens/generate endpoint created
  - Accepts audience and lifetime_days
  - Returns JWT token and expiration
  - Requires authentication
  - API documentation (OpenAPI)

---

## 🎯 Track 3: n8n Node Implementation (Frontend/Node.js)

### **SP-XXXX: Create n8n Credential Type**
- **Type**: Task
- **Story Points**: 2
- **Duration**: 1 day
- **Component**: Portal MCP
- **Epic Link**: SP-28789
- **Description**: Create CTERA Portal JWT credential type for n8n
- **Acceptance Criteria**:
  - CteraPortalAuth.credentials.ts created
  - Fields: serverUrl, portalJwt, allowUnauthorizedCerts
  - Credential type registered in n8n
  - Test credential functionality

---

### **SP-XXXX: Implement n8n Node Core Infrastructure**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 1 day
- **Component**: Portal MCP
- **Epic Link**: SP-28789
- **Depends On**: Create n8n Credential Type
- **Description**: Create n8n node skeleton with authentication
- **Acceptance Criteria**:
  - CteraFilesystem.node.ts created
  - HTTP client configured with JWT Bearer
  - X-Portal-JWT header added
  - Error handling for 401/403/500
  - Node icon and metadata configured

---

### **SP-XXXX: Implement File Operations (6 operations)**
- **Type**: Task
- **Story Points**: 5
- **Duration**: 1.5 days
- **Component**: Portal MCP
- **Epic Link**: SP-28789
- **Depends On**: n8n Node Core Infrastructure
- **Description**: Implement core file operations
- **Acceptance Criteria**:
  - Read, Write, Delete, Copy, Move, Get Metadata operations
  - Unit tests for each operation
  - Error handling

---

### **SP-XXXX: Implement Directory Operations (4 operations)**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 1 day
- **Component**: Portal MCP
- **Epic Link**: SP-28789
- **Depends On**: n8n Node Core Infrastructure
- **Description**: Implement directory operations
- **Acceptance Criteria**:
  - Create, Delete, List, Get Metadata operations
  - Unit tests for each operation

---

### **SP-XXXX: Implement Versioning & Link Operations (8 operations)**
- **Type**: Task
- **Story Points**: 5
- **Duration**: 1.5 days
- **Component**: Portal MCP
- **Epic Link**: SP-28789
- **Depends On**: n8n Node Core Infrastructure
- **Description**: Implement version management and link operations
- **Acceptance Criteria**:
  - List/Get/Restore/Delete File Versions
  - Create/Delete/List/Update Public Links
  - Unit tests for each operation

---

## 🎯 Track 4: Testing & Documentation (QA/Tech Writers)

### **SP-XXXX: End-to-End Integration Testing**
- **Type**: Task
- **Story Points**: 5
- **Duration**: 2 days
- **Component**: Portal MCP, Authentication
- **Epic Link**: SP-28789
- **Depends On**: All implementation tasks
- **Description**: Comprehensive E2E testing of entire flow
- **Acceptance Criteria**:
  - Test JWT generation via Portal API
  - Test all 18 n8n operations against live Portal
  - Test dual authentication (n8n + CTERA AI)
  - Test error scenarios
  - Test with large files (>1GB)
  - Performance testing (<500ms)
  - Test WOPI regression
  - Test CTERA AI regression

---

### **SP-XXXX: Security Review & Hardening**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 1 day
- **Component**: Authentication
- **Epic Link**: SP-28789
- **Depends On**: End-to-End Integration Testing
- **Description**: Security review of JWT implementation
- **Acceptance Criteria**:
  - Code review for security vulnerabilities
  - Verify JWT signature cannot be bypassed
  - Verify secrets are not logged
  - Penetration testing
  - Security scan (OWASP, Snyk)
  - Security review sign-off

---

### **SP-XXXX: Documentation & User Guide**
- **Type**: Task
- **Story Points**: 3
- **Duration**: 2 days (parallel with E2E testing)
- **Component**: Portal MCP
- **Epic Link**: SP-28789
- **Depends On**: Implement Versioning & Link Operations
- **Description**: Create comprehensive documentation
- **Acceptance Criteria**:
  - User guide for JWT generation
  - User guide for n8n node installation
  - Examples for all 18 operations
  - Developer guide for JWT framework
  - API documentation (OpenAPI)
  - Architecture diagram
  - Configuration guide

---

## 📊 Task Creation Order (Recommended)

### **Phase 1 - Foundation (Create First)**
1. SP-XXXX: Create JWT Framework Package Structure
2. SP-XXXX: Configure Portal Secret Management
3. SP-XXXX: Implement nginx Dual Authentication Path
4. SP-XXXX: Create n8n Credential Type

### **Phase 2 - Core Implementation (Week 1-2)**
5. SP-XXXX: Extract Secret Derivation from WOPI
6. SP-XXXX: Extract JWT Generation from WOPI
7. SP-XXXX: Extract JWT Validation from WOPI
8. SP-XXXX: Create JwtService
9. SP-XXXX: Implement n8n Node Core Infrastructure

### **Phase 3 - Integration (Week 2-3)**
10. SP-XXXX: Update WOPI to Use Generic Framework
11. SP-XXXX: Implement JwtAuthorizationBearerValidator
12. SP-XXXX: Create Portal JWT Token Generation API
13. SP-XXXX: Implement File Operations
14. SP-XXXX: Implement Directory Operations
15. SP-XXXX: Implement Versioning & Link Operations

### **Phase 4 - Finalization (Week 3.5)**
16. SP-XXXX: JWT Framework Testing & Documentation
17. SP-XXXX: End-to-End Integration Testing
18. SP-XXXX: Security Review & Hardening
19. SP-XXXX: Documentation & User Guide

---

## 🎨 Task Template (Copy for Each Task)

```
Summary: [Task Name from above]
Type: Task
Project: ServicePortal (SP)
Epic Link: SP-28789
Components: [See above for each task]
Story Points: [See above]
Description: [See above]

Acceptance Criteria:
[See above - copy as checklist]

Labels: n8n, jwt, authentication, mcp (add as appropriate)
```

---

## ✅ Tips for Task Creation

1. **Create in order** (Phase 1 → 4) to respect dependencies
2. **Link dependencies** using "is blocked by" relationship in Jira
3. **Assign to teams**:
   - Track 1 & 2: Backend team
   - Track 3: Frontend/Node.js team
   - Track 4: QA + Tech Writers
4. **Use labels**: `n8n`, `jwt`, `authentication`, `mcp`, `wopi`
5. **Add to sprint**: Once tasks are created, add to appropriate sprints
6. **Epic board**: Use Jira epic board to track overall progress

---

## 📈 Progress Tracking

**Use this epic burndown**:
- Total Story Points: 54 points
- Total Tasks: 15 tasks
- Timeline: 3.5 weeks (~17 days)

**Milestones**:
- Week 1: JWT Framework foundation complete
- Week 2: JWT Framework integrated, n8n node skeleton
- Week 3: All operations implemented
- Week 3.5: Testing & docs complete, ready for staging

---

**Epic**: [SP-28789](https://cteranet.atlassian.net/browse/SP-28789)  
**Full Task Details**: See `JIRA_EPIC_DESCRIPTION.md` in this folder

