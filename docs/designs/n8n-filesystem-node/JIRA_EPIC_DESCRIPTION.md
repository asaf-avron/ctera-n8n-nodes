# Epic: n8n CTERA Filesystem Node - Description & Tasks

## 📋 Epic Description for SP-28789

### **Overview**
Build an n8n CTERA Global Filesystem Node that enables workflow automation for CTERA Portal file operations. This requires implementing a **generic, reusable JWT authentication framework** extracted from existing WOPI code, supporting both non-interactive automation (n8n) and interactive flows (CTERA AI).

### **Business Value**
- **Enable Automation**: Customers can automate file operations (upload, download, versioning) in n8n workflows
- **Improve Integration**: Generic JWT framework serves as foundation for Portal API v2, mobile apps, and third-party integrations
- **Reduce Complexity**: Extract battle-tested JWT code from WOPI into reusable framework (DRY principle)
- **Maintain Security**: Leverage existing, proven security patterns with HMAC-SHA256 and jose4j library

### **Scope**
**Phase 0** (This Epic):
- Generic JWT authentication framework (`com.ctera.auth.jwt`)
- nginx dual authentication path (Portal JWT + oauth2-proxy)
- n8n community node with 18 filesystem operations
- Long-lived JWT tokens (60-90 days)

**Future (Phase 2)**: Add refresh tokens (1h access + 90d refresh)

### **Technical Approach**
1. **Extract JWT code from WOPI** → Generic framework
2. **Support dual authentication**:
   - Route 1: Portal JWT → Portal Backend (n8n automation)
   - Route 2: oauth2-proxy → IdP (CTERA AI, interactive)
3. **Implement n8n node** with 18 filesystem operations
4. **Backward compatible** with existing WOPI implementation

### **Success Criteria**
- ✅ Generic JWT framework operational (WOPI, MCP, Share Management)
- ✅ n8n node published and tested with all 18 operations
- ✅ Dual authentication working (nginx routing)
- ✅ No regressions in existing WOPI or CTERA AI functionality
- ✅ Documentation complete (API, configuration, user guide)
- ✅ Security review passed

### **Timeline**
~3.5 weeks (17 business days)

### **References**
- Epic: [SP-28789](https://cteranet.atlassian.net/browse/SP-28789)
- Design Documents: `Backend/docs/designs/n8n-filesystem-node/`
- Main Spec: `n8n-ctera-filesystem-node-spec.md`
- Implementation Plan: `WOPI_CODE_EXTRACTION_PLAN.md`

---

## 🎯 Task Breakdown (Parallel Work)

### **Track 1: Generic JWT Framework** (Backend - Java)
**Team**: Backend Engineers  
**Duration**: 10 days  
**Dependencies**: None (can start immediately)

#### **Task 1.1: Create JWT Framework Package Structure**
**Story Points**: 2  
**Duration**: 1 day

**Description**:
Create package structure and core interfaces for generic JWT framework.

**Acceptance Criteria**:
- [ ] Package `com.ctera.auth.jwt` created with subpackages: `core`, `models`, `secrets`, `validators`, `exceptions`, `config`
- [ ] `TokenAudience` enum implemented (WOPI, MCP, SHARE, API, MOBILE, INTEGRATION, INTERNAL)
- [ ] `SecretProvider` interface defined
- [ ] `JwtClaims` model class created
- [ ] Basic exception classes created

**Files to Create**:
- `com.ctera.auth.jwt.models.TokenAudience.java`
- `com.ctera.auth.jwt.secrets.SecretProvider.java`
- `com.ctera.auth.jwt.models.JwtClaims.java`
- `com.ctera.auth.jwt.exceptions.JwtAuthenticationException.java`

**Reference**: `WOPI_CODE_EXTRACTION_PLAN.md` Phase 1

---

#### **Task 1.2: Extract Secret Derivation from WOPI**
**Story Points**: 3  
**Duration**: 1 day  
**Dependencies**: Task 1.1

**Description**:
Extract secret derivation logic from `WOPIUtils.generateOfficeKey()` into generic `SecretDerivation` class. Implement both master key derivation (Portal-only) and shared secrets (Portal ↔ Gateway).

**Acceptance Criteria**:
- [ ] `SecretDerivation.deriveSecret()` implemented with HMAC-SHA256
- [ ] `PortalSecretProvider` implemented with master key derivation
- [ ] `SharedSecretProvider` implemented for share management
- [ ] Unit tests pass with WOPI reference values
- [ ] Code matches existing WOPI behavior exactly

**Files to Create**:
- `com.ctera.auth.jwt.secrets.SecretDerivation.java`
- `com.ctera.auth.jwt.secrets.PortalSecretProvider.java`
- `com.ctera.auth.jwt.secrets.SharedSecretProvider.java`
- `SecretDerivationTest.java`

**Reference**: `WOPI_CODE_EXTRACTION_PLAN.md` Phase 2

---

#### **Task 1.3: Extract JWT Generation from WOPI**
**Story Points**: 3  
**Duration**: 1.5 days  
**Dependencies**: Task 1.2

**Description**:
Extract JWT generation logic from `WOPIUtils.generateJWTAccessToken()` into generic `JwtGenerator` class.

**Acceptance Criteria**:
- [ ] `JwtGenerator.generate()` implemented using jose4j
- [ ] HMAC-SHA256 signature algorithm
- [ ] Supports custom claims and configurable expiration
- [ ] Unit tests generate valid JWTs matching WOPI format
- [ ] Generated tokens can be decoded by jose4j

**Files to Create**:
- `com.ctera.auth.jwt.core.JwtGenerator.java`
- `JwtGeneratorTest.java`

**Reference**: `WOPI_CODE_EXTRACTION_PLAN.md` Phase 3

---

#### **Task 1.4: Extract JWT Validation from WOPI**
**Story Points**: 3  
**Duration**: 1.5 days  
**Dependencies**: Task 1.2

**Description**:
Extract JWT validation logic from `WOPIUtils.validateJWTAccessToken()` into generic `JwtValidator` class.

**Acceptance Criteria**:
- [ ] `JwtValidator.validate()` implemented using jose4j
- [ ] Signature validation enforced
- [ ] Expiration validation enforced
- [ ] Audience validation enforced
- [ ] Specific exceptions for expired/invalid tokens
- [ ] Unit tests validate WOPI-generated tokens

**Files to Create**:
- `com.ctera.auth.jwt.core.JwtValidator.java`
- `com.ctera.auth.jwt.exceptions.TokenExpiredException.java`
- `com.ctera.auth.jwt.exceptions.InvalidAudienceException.java`
- `JwtValidatorTest.java`

**Reference**: `WOPI_CODE_EXTRACTION_PLAN.md` Phase 4

---

#### **Task 1.5: Create JwtService (Main Entry Point)**
**Story Points**: 2  
**Duration**: 0.5 days  
**Dependencies**: Task 1.3, Task 1.4

**Description**:
Create high-level `JwtService` that combines generator and validator with clean API.

**Acceptance Criteria**:
- [ ] `JwtService.generateToken()` implemented
- [ ] `JwtService.validateToken()` implemented
- [ ] Delegates to `JwtGenerator` and `JwtValidator`
- [ ] Integration tests pass (generate → validate round-trip)

**Files to Create**:
- `com.ctera.auth.jwt.core.JwtService.java`
- `JwtServiceTest.java`

**Reference**: `WOPI_CODE_EXTRACTION_PLAN.md` Phase 5

---

#### **Task 1.6: Update WOPI to Use Generic Framework**
**Story Points**: 5  
**Duration**: 2 days  
**Dependencies**: Task 1.5

**Description**:
Refactor `WOPIUtils` to delegate to generic JWT framework while maintaining backward compatibility.

**Acceptance Criteria**:
- [ ] `WOPIUtils.generateJWTAccessToken()` delegates to `JwtService`
- [ ] `WOPIUtils.validateJWTAccessToken()` delegates to `JwtService`
- [ ] All existing WOPI unit tests pass unchanged
- [ ] WOPI token format unchanged
- [ ] No breaking changes to WOPI API
- [ ] Office Online integration still works

**Files to Modify**:
- `com.ctera.fileViewAndEdit.officeOnline.WOPIUtils.java`

**Tests to Verify**:
- All existing WOPI tests (ensure 100% pass)

**Reference**: `WOPI_CODE_EXTRACTION_PLAN.md` Phase 6

---

#### **Task 1.7: Implement JwtAuthorizationBearerValidator**
**Story Points**: 5  
**Duration**: 2 days  
**Dependencies**: Task 1.5

**Description**:
Create Spring Security bearer validator for Portal-issued JWTs, integrating with existing bearer authentication valve.

**Acceptance Criteria**:
- [ ] `JwtAuthorizationBearerValidator` implements `AuthorizationBearerValidator`
- [ ] Validates JWT using `JwtService`
- [ ] Returns `UserPrincipal` from validated claims
- [ ] Plugs into existing `AuthenticationBearerAuthenticator` valve
- [ ] Integration tests with Spring Security context

**Files to Create**:
- `com.ctera.auth.jwt.validators.JwtAuthorizationBearerValidator.java`
- `JwtAuthorizationBearerValidatorTest.java`

**Reference**: `WOPI_CODE_EXTRACTION_PLAN.md` Phase 7

---

#### **Task 1.8: JWT Framework Testing & Documentation**
**Story Points**: 3  
**Duration**: 2 days  
**Dependencies**: Task 1.6, Task 1.7

**Description**:
Comprehensive testing and documentation for JWT framework.

**Acceptance Criteria**:
- [ ] Unit test coverage >80% for core classes
- [ ] Integration tests for all audiences (WOPI, MCP, SHARE)
- [ ] Security test cases (signature tampering, expired tokens)
- [ ] JavaDoc for all public methods
- [ ] README for framework usage
- [ ] Migration guide for new audiences

**Deliverables**:
- Test reports with coverage metrics
- `Common/src/main/java/com/ctera/auth/jwt/README.md`
- JavaDoc generated

**Reference**: `WOPI_CODE_EXTRACTION_PLAN.md` Phase 8

---

### **Track 2: Portal Configuration & nginx** (DevOps/Backend)
**Team**: DevOps + Backend Engineers  
**Duration**: 3 days  
**Dependencies**: Can start in parallel with Track 1

#### **Task 2.1: Configure Portal Secret Management**
**Story Points**: 3  
**Duration**: 1 day  
**Dependencies**: None

**Description**:
Set up Portal configuration for master key and shared secrets. Add database schema changes if needed.

**Acceptance Criteria**:
- [ ] `SystemSettings.MasterKey` configured or created
- [ ] `SystemSettings.ShareManagementSecret` configured or created
- [ ] Master key generated using `openssl rand -hex 32`
- [ ] Share secret generated and configured
- [ ] `PortalConfiguration.getMasterKey()` implemented
- [ ] `PortalConfiguration.getShareManagementSecret()` implemented
- [ ] Secrets not logged in application logs
- [ ] Migration script created (if schema changes needed)

**Files to Modify/Create**:
- `Portal-Schema/src/main/resources/schema/schema_settings.xml` (if adding new columns)
- `com.ctera.setup.PortalConfiguration.java`
- Migration SQL script

**Reference**: `PORTAL_CONFIGURATION_SHARED_SECRETS.md`

---

#### **Task 2.2: Implement nginx Dual Authentication Path**
**Story Points**: 5  
**Duration**: 2 days  
**Dependencies**: None (can start in parallel)

**Description**:
Configure nginx to route MCP requests based on `X-Portal-JWT` header: Portal JWT → Portal Backend validation, otherwise → oauth2-proxy.

**Acceptance Criteria**:
- [ ] nginx location block for `/_SRV/MCP/mcp` updated
- [ ] Routes to Portal Backend if `X-Portal-JWT: true` header present
- [ ] Routes to oauth2-proxy (existing behavior) if header absent
- [ ] Portal JWT validation endpoint created (`/api/auth/validate-jwt`)
- [ ] Integration test: n8n request with Portal JWT succeeds
- [ ] Integration test: CTERA AI request without header succeeds
- [ ] No impact to existing CTERA AI flows

**Files to Modify/Create**:
- `ctera.conf` (nginx configuration)
- `com.ctera.api.auth.JwtValidationController.java` (new endpoint)

**Reference**: `NGINX_DUAL_AUTH_SOLUTION.md`

---

#### **Task 2.3: Create Portal JWT Token Generation API**
**Story Points**: 3  
**Duration**: 1 day  
**Dependencies**: Task 1.5 (JwtService), Task 2.1 (secrets)

**Description**:
Create REST API endpoint for generating Portal JWTs (for n8n and other integrations).

**Acceptance Criteria**:
- [ ] `POST /api/auth/tokens/generate` endpoint created
- [ ] Accepts: `{audience: "mcp", lifetime_days: 60}`
- [ ] Returns: `{token: "eyJ...", expires_at: "..."}`
- [ ] Requires authentication (existing Portal session/basic auth)
- [ ] Validates audience is supported
- [ ] Integration tests for all audiences
- [ ] API documentation (OpenAPI/Swagger)

**Files to Create**:
- `com.ctera.api.auth.TokenGenerationController.java`
- API tests

**Reference**: `n8n-ctera-filesystem-node-spec.md` Section 4.2.2

---

### **Track 3: n8n Node Implementation** (Frontend/Node.js)
**Team**: Frontend/Node.js Engineers  
**Duration**: 5 days  
**Dependencies**: Task 2.3 (token generation API)

#### **Task 3.1: Create n8n Credential Type**
**Story Points**: 2  
**Duration**: 1 day  
**Dependencies**: None (can start with mock credentials)

**Description**:
Create CTERA Portal JWT credential type for n8n.

**Acceptance Criteria**:
- [ ] `CteraPortalAuth.credentials.ts` created
- [ ] Fields: `serverUrl`, `portalJwt`, `allowUnauthorizedCerts`
- [ ] Credential type registered in n8n
- [ ] Password field type for JWT (hidden)
- [ ] URL validation for serverUrl
- [ ] Test credential functionality implemented

**Files to Create**:
- `credentials/CteraPortalAuth.credentials.ts`

**Reference**: `n8n-ctera-filesystem-node-spec.md` Section 4.2.3

---

#### **Task 3.2: Implement n8n Node Core Infrastructure**
**Story Points**: 3  
**Duration**: 1 day  
**Dependencies**: Task 3.1

**Description**:
Create n8n node skeleton with authentication and HTTP client setup.

**Acceptance Criteria**:
- [ ] `CteraFilesystem.node.ts` created
- [ ] Node registered with n8n
- [ ] HTTP client configured with JWT Bearer token
- [ ] `X-Portal-JWT: true` header added to all requests
- [ ] Error handling for 401/403/500 responses
- [ ] Node icon and metadata configured

**Files to Create**:
- `nodes/CteraFilesystem/CteraFilesystem.node.ts`
- `nodes/CteraFilesystem/ctera-filesystem.svg`

**Reference**: `n8n-ctera-filesystem-node-spec.md` Section 4.2.3

---

#### **Task 3.3: Implement File Operations (6 operations)**
**Story Points**: 5  
**Duration**: 1.5 days  
**Dependencies**: Task 3.2

**Description**:
Implement core file operations: Read, Write, Delete, Copy, Move, Get Metadata.

**Acceptance Criteria**:
- [ ] Read File (download) operation
- [ ] Write File (upload) operation  
- [ ] Delete File operation
- [ ] Copy File operation
- [ ] Move File operation
- [ ] Get File Metadata operation
- [ ] Unit tests for each operation
- [ ] Error handling for file not found, permission denied

**Reference**: `n8n-ctera-filesystem-node-spec.md` Section 3.1

---

#### **Task 3.4: Implement Directory Operations (4 operations)**
**Story Points**: 3  
**Duration**: 1 day  
**Dependencies**: Task 3.2

**Description**:
Implement directory operations: Create, Delete, List, Get Metadata.

**Acceptance Criteria**:
- [ ] Create Directory operation
- [ ] Delete Directory operation
- [ ] List Directory Contents operation (with pagination)
- [ ] Get Directory Metadata operation
- [ ] Unit tests for each operation

**Reference**: `n8n-ctera-filesystem-node-spec.md` Section 3.2

---

#### **Task 3.5: Implement Versioning & Link Operations (8 operations)**
**Story Points**: 5  
**Duration**: 1.5 days  
**Dependencies**: Task 3.2

**Description**:
Implement version management and link operations.

**Acceptance Criteria**:
- [ ] List File Versions operation
- [ ] Get File Version operation
- [ ] Restore File Version operation
- [ ] Delete File Version operation
- [ ] Create Public Link operation
- [ ] Delete Public Link operation
- [ ] List Public Links operation
- [ ] Update Public Link operation
- [ ] Unit tests for each operation

**Reference**: `n8n-ctera-filesystem-node-spec.md` Sections 3.3, 3.4

---

### **Track 4: Testing & Documentation** (QA/Tech Writers)
**Team**: QA Engineers + Technical Writers  
**Duration**: 3 days (final week)  
**Dependencies**: All implementation tasks

#### **Task 4.1: End-to-End Integration Testing**
**Story Points**: 5  
**Duration**: 2 days  
**Dependencies**: Task 1.7, Task 2.3, Task 3.5

**Description**:
Comprehensive end-to-end testing of entire flow: Portal JWT generation → n8n node → MCP → Portal Backend.

**Acceptance Criteria**:
- [ ] Test JWT generation via Portal API
- [ ] Test all 18 n8n operations against live Portal
- [ ] Test dual authentication (n8n + CTERA AI)
- [ ] Test error scenarios (expired token, invalid audience, permission denied)
- [ ] Test with large files (>1GB)
- [ ] Performance testing (latency <500ms for metadata ops)
- [ ] Test WOPI regression (Office Online still works)
- [ ] Test CTERA AI regression (existing flows still work)

**Deliverables**:
- Test plan document
- Test cases executed (manual + automated)
- Bug reports filed
- Performance metrics documented

---

#### **Task 4.2: Security Review & Hardening**
**Story Points**: 3  
**Duration**: 1 day  
**Dependencies**: Task 4.1

**Description**:
Security review of JWT implementation, secret management, and API endpoints.

**Acceptance Criteria**:
- [ ] Code review for security vulnerabilities
- [ ] Verify JWT signature cannot be bypassed
- [ ] Verify expiration is enforced
- [ ] Verify secrets are not logged
- [ ] Verify audience validation is strict
- [ ] Penetration testing (token tampering, replay attacks)
- [ ] Security scan (OWASP, Snyk)
- [ ] Security review sign-off

**Deliverables**:
- Security review report
- Vulnerability assessment (if any)
- Remediation plan (if needed)

---

#### **Task 4.3: Documentation & User Guide**
**Story Points**: 3  
**Duration**: 2 days (parallel with Task 4.1)  
**Dependencies**: Task 3.5

**Description**:
Create comprehensive documentation for users and developers.

**Acceptance Criteria**:
- [ ] User guide: How to generate Portal JWT
- [ ] User guide: How to install n8n node
- [ ] User guide: How to configure credentials
- [ ] User guide: Examples for all 18 operations
- [ ] Developer guide: JWT framework usage
- [ ] Developer guide: Adding new audiences
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture diagram
- [ ] Configuration guide for DevOps

**Deliverables**:
- User documentation (Confluence/GitBook)
- Developer documentation (JavaDoc + README)
- API reference
- Video tutorial (optional)

---

## 📊 Task Dependencies & Timeline

```
Week 1:
├─ Track 1: Task 1.1 → 1.2 → 1.3
├─ Track 1: Task 1.1 → 1.2 → 1.4
├─ Track 2: Task 2.1 (parallel)
└─ Track 2: Task 2.2 (parallel)

Week 2:
├─ Track 1: Task 1.5 → 1.6 (WOPI backward compat)
├─ Track 1: Task 1.5 → 1.7 (Bearer validator)
├─ Track 2: Task 2.3 (depends on 1.5, 2.1)
└─ Track 3: Task 3.1 → 3.2 (can start in parallel)

Week 3:
├─ Track 1: Task 1.8 (testing & docs)
├─ Track 3: Task 3.3, 3.4, 3.5 (all operations)
└─ Track 4: Task 4.3 (docs, parallel)

Week 3.5:
├─ Track 4: Task 4.1 (E2E testing)
└─ Track 4: Task 4.2 (security review)
```

---

## 🎯 Parallel Work Opportunities

**Can Start Immediately** (No Dependencies):
- Task 1.1: JWT Framework Structure
- Task 2.1: Portal Secret Configuration
- Task 2.2: nginx Dual Auth
- Task 3.1: n8n Credential Type

**Can Work in Parallel** (Week 1-2):
- Backend Team A: Task 1.1 → 1.2 → 1.3 (JWT Generation)
- Backend Team B: Task 1.1 → 1.2 → 1.4 (JWT Validation)
- DevOps Team: Task 2.1 + 2.2 (Configuration + nginx)
- Frontend Team: Task 3.1 → 3.2 (n8n skeleton)

**Can Work in Parallel** (Week 2-3):
- Backend Team A: Task 1.6 (WOPI refactor)
- Backend Team B: Task 1.7 (Bearer validator) + Task 2.3 (Token API)
- Frontend Team A: Task 3.3 (File operations)
- Frontend Team B: Task 3.4 + 3.5 (Directory + versioning)
- Tech Writer: Task 4.3 (Documentation)

**Final Week** (Week 3.5):
- QA Team: Task 4.1 (E2E testing)
- Security Team: Task 4.2 (Security review)

---

## ✅ Definition of Done (Epic Level)

- [ ] All 15 tasks completed and merged to dev branch
- [ ] Generic JWT framework operational (100% test coverage)
- [ ] WOPI backward compatible (no regressions)
- [ ] nginx dual authentication working
- [ ] n8n node published to npm (or private registry)
- [ ] All 18 operations tested and working
- [ ] Security review passed (no critical/high vulnerabilities)
- [ ] Performance targets met (<500ms for metadata ops)
- [ ] Documentation complete (user + developer guides)
- [ ] Deployed to staging and validated
- [ ] Sign-off from Product Owner
- [ ] Ready for production release

---

## 📚 Reference Documents

All design documents located in: `Backend/docs/designs/n8n-filesystem-node/`

1. **Main Specification**: `n8n-ctera-filesystem-node-spec.md`
2. **Implementation Plan**: `WOPI_CODE_EXTRACTION_PLAN.md`
3. **Secret Configuration**: `PORTAL_CONFIGURATION_SHARED_SECRETS.md`
4. **nginx Configuration**: `NGINX_DUAL_AUTH_SOLUTION.md`
5. **Architecture Analysis**: `OAUTH2_PROXY_INTEGRATION_ANALYSIS.md`
6. **Strategic Decisions**: `GENERIC_JWT_FRAMEWORK_DESIGN.md`
7. **MCP Findings**: `MCP_IMPLEMENTATION_FINDINGS.md`
8. **Executive Summary**: `IMPLEMENTATION_READY_SUMMARY.md`

---

**Ready to create tasks in Jira!** 🚀

