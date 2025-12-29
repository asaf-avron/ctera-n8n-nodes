# 🏗️ Generic JWT Framework Design - Serving Multiple Use Cases

**Date**: December 28, 2024  
**Purpose**: Design a unified JWT framework for MCP, Share Management, and future needs

---

## 🎯 REQUIREMENTS

### **User's Strategic Questions**:

1. **Can we extract common code from WOPI** for generic JWT implementation?
   - ✅ **YES!** WOPI already has excellent JWT generation and validation using jose4j
   
2. **Can this serve share management JWT validation** (Portal ↔ Gateway with shared secret)?
   - ✅ **YES!** Same HMAC-SHA256 pattern, just different audiences and claims

3. **Dilemma #4 Decision**: Audience only (no fine-grained scopes initially)
   - ✅ Simpler, YAGNI principle

---

## 📊 USE CASES TO SUPPORT

| Use Case | Issuer | Validator | Secret | Audience | Claims |
|----------|--------|-----------|--------|----------|---------|
| **WOPI** | Portal | Portal | Derived from master key | `wopi` | fileId, userId, shareKey, snapshotId |
| **MCP** | Portal | Portal | Portal secret | `mcp` | userId, tenant, uid |
| **Share Management** | Portal | Gateway | **Shared secret** (Portal ↔ GW) | `share` | shareKey, permissions, expiry |
| **Future: Portal API v2** | Portal | Portal | Portal secret | `api` | userId, tenant, scopes |
| **Future: Mobile** | Portal | Portal | Portal secret | `mobile` | userId, deviceId |

---

## 🔑 KEY INSIGHT FROM WOPI

**WOPI already implements**:
- ✅ JWT generation with custom claims
- ✅ JWT validation with HMAC-SHA256
- ✅ Expiration handling
- ✅ Subject validation
- ✅ Uses jose4j library

**WOPI code to extract** (from `WOPIUtils.java` lines 111-145):

```java
// Generation
public String generateJWTAccessToken(AccessTokenData data, String key) {
    Key privateKey = new HmacKey(key.getBytes("UTF-8"));
    JwtClaims claims = new JwtClaims();
    // claims.setExpirationTimeMinutesInTheFuture(data.getExpMinutes()); 
    claims.setSubject(data.getUserId());
    claims.setClaim("fileId", data.getFileId());
    claims.setClaim("shareKey", data.getShareKey());
    // ... more claims
    
    JsonWebSignature jws = new JsonWebSignature();
    jws.setPayload(claims.toJson());
    jws.setKey(privateKey);
    jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.HMAC_SHA256);
    return jws.getCompactSerialization();
}

// Validation
public AccessTokenData validateJWTAccessToken(String token, String key) {
    Key hmacKey = new HmacKey(key.getBytes("UTF-8"));
    JwtConsumer consumer = new JwtConsumerBuilder()
        .setRequireSubject()
        .setVerificationKey(hmacKey)
        .build();
    JwtClaims claims = consumer.processToClaims(token);
    return extractData(claims);
}
```

---

## 🏗️ PROPOSED GENERIC FRAMEWORK

### **Package Structure**

```
Common/src/main/java/com/ctera/auth/jwt/
├── core/
│   ├── JwtService.java                 // Main entry point (extracted from WOPI)
│   ├── JwtGenerator.java               // Token generation (generalized WOPI)
│   ├── JwtValidator.java               // Token validation (generalized WOPI)
│   └── JwtConfig.java                  // Configuration provider
├── models/
│   ├── JwtToken.java                   // Token wrapper
│   ├── JwtClaims.java                  // Claims model
│   ├── TokenAudience.java              // Enum: WOPI, MCP, SHARE, API, MOBILE
│   └── TokenMetadata.java              // Token info for management
├── validators/
│   ├── JwtAuthorizationBearerValidator.java  // Bearer auth chain integration
│   └── AudienceValidator.java          // Audience-specific validation
├── secrets/
│   ├── SecretProvider.java             // Interface for secret retrieval
│   ├── PortalSecretProvider.java       // Portal master key → derived secrets
│   ├── SharedSecretProvider.java       // Shared secrets (Portal ↔ Gateway)
│   └── SecretDerivation.java           // Key derivation (WOPI pattern)
└── exceptions/
    ├── JwtAuthenticationException.java
    ├── TokenExpiredException.java
    └── InvalidAudienceException.java
```

---

## 🎨 DESIGN: Extract & Generalize WOPI Code

### **1. JwtService (Main Entry Point)**

```java
package com.ctera.auth.jwt.core;

public class JwtService {
    private final JwtGenerator generator;
    private final JwtValidator validator;
    
    public JwtService(SecretProvider secretProvider) {
        this.generator = new JwtGenerator(secretProvider);
        this.validator = new JwtValidator(secretProvider);
    }
    
    // Generate token for any audience
    public String generateToken(TokenAudience audience, 
                                 String subject, 
                                 Map<String, Object> claims,
                                 Duration expiration) {
        return generator.generate(audience, subject, claims, expiration);
    }
    
    // Validate token for any audience
    public JwtClaims validateToken(String token, TokenAudience audience) 
            throws JwtAuthenticationException {
        return validator.validate(token, audience);
    }
}
```

---

### **2. JwtGenerator (Extracted from WOPI)**

```java
package com.ctera.auth.jwt.core;

import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims as Jose4jClaims;
import org.jose4j.keys.HmacKey;

public class JwtGenerator {
    private final SecretProvider secretProvider;
    
    public String generate(TokenAudience audience, 
                          String subject,
                          Map<String, Object> customClaims,
                          Duration expiration) throws CteraException {
        try {
            // Get secret for this audience
            String secret = secretProvider.getSecret(audience);
            Key key = new HmacKey(secret.getBytes("UTF-8"));
            
            // Build claims (extracted from WOPI pattern)
            Jose4jClaims claims = new Jose4jClaims();
            claims.setIssuer("ctera-portal");
            claims.setAudience(audience.getValue());
            claims.setSubject(subject);
            claims.setIssuedAtToNow();
            claims.setExpirationTime(
                NumericDate.fromMilliseconds(
                    System.currentTimeMillis() + expiration.toMillis()
                )
            );
            
            // Add custom claims
            customClaims.forEach(claims::setClaim);
            
            // Sign (same as WOPI)
            JsonWebSignature jws = new JsonWebSignature();
            jws.setPayload(claims.toJson());
            jws.setKey(key);
            jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.HMAC_SHA256);
            
            return jws.getCompactSerialization();
        } catch (Exception e) {
            throw CteraExceptionFactory.create("JWT generation failed", e);
        }
    }
}
```

---

### **3. JwtValidator (Extracted from WOPI)**

```java
package com.ctera.auth.jwt.core;

import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.HmacKey;

public class JwtValidator {
    private final SecretProvider secretProvider;
    
    public JwtClaims validate(String token, TokenAudience audience) 
            throws JwtAuthenticationException {
        try {
            // Get secret for this audience
            String secret = secretProvider.getSecret(audience);
            Key key = new HmacKey(secret.getBytes("UTF-8"));
            
            // Build consumer (same pattern as WOPI)
            JwtConsumer consumer = new JwtConsumerBuilder()
                .setRequireSubject()
                .setExpectedIssuer("ctera-portal")
                .setExpectedAudience(audience.getValue())
                .setVerificationKey(key)
                .setRequireExpirationTime()
                .build();
            
            // Validate
            Jose4jClaims claims = consumer.processToClaims(token);
            
            // Convert to our model
            return convertClaims(claims);
        } catch (InvalidJwtException e) {
            throw new JwtAuthenticationException("Invalid JWT", e);
        } catch (Exception e) {
            throw new JwtAuthenticationException("JWT validation failed", e);
        }
    }
}
```

---

## 🔑 SECRET MANAGEMENT DESIGN

### **Challenge**: Different use cases need different secrets

| Use Case | Secret Source | Derivation |
|----------|---------------|------------|
| **WOPI** | Portal master key | HMAC-SHA256("office") |
| **MCP** | Portal master key | HMAC-SHA256("mcp") |
| **Share (Portal)** | **Shared secret** | Direct use (no derivation) |
| **Share (Gateway)** | **Shared secret** | Direct use (no derivation) |

---

### **SecretProvider Interface**

```java
package com.ctera.auth.jwt.secrets;

public interface SecretProvider {
    /**
     * Get the secret for a specific audience.
     * Implementations may derive secrets or use shared secrets.
     */
    String getSecret(TokenAudience audience) throws CteraException;
    
    /**
     * Check if this provider can provide secret for given audience.
     */
    boolean supportsAudience(TokenAudience audience);
}
```

---

### **PortalSecretProvider (Derived Secrets)**

```java
package com.ctera.auth.jwt.secrets;

public class PortalSecretProvider implements SecretProvider {
    private final String masterKey;
    
    public PortalSecretProvider(String masterKey) {
        this.masterKey = masterKey;
    }
    
    @Override
    public String getSecret(TokenAudience audience) throws CteraException {
        // Use WOPI's pattern for secret derivation
        return SecretDerivation.deriveSecret(masterKey, audience.getValue());
    }
    
    @Override
    public boolean supportsAudience(TokenAudience audience) {
        return audience == TokenAudience.WOPI ||
               audience == TokenAudience.MCP ||
               audience == TokenAudience.API ||
               audience == TokenAudience.MOBILE;
    }
}
```

---

### **SharedSecretProvider (Portal ↔ Gateway)**

```java
package com.ctera.auth.jwt.secrets;

public class SharedSecretProvider implements SecretProvider {
    private final Map<TokenAudience, String> sharedSecrets;
    
    public SharedSecretProvider() {
        // Load shared secrets from configuration
        // For share management: Portal and Gateway have same secret
        this.sharedSecrets = loadSharedSecrets();
    }
    
    @Override
    public String getSecret(TokenAudience audience) throws CteraException {
        String secret = sharedSecrets.get(audience);
        if (secret == null) {
            throw new CteraException("No shared secret for audience: " + audience);
        }
        return secret;
    }
    
    @Override
    public boolean supportsAudience(TokenAudience audience) {
        return audience == TokenAudience.SHARE;
    }
    
    private Map<TokenAudience, String> loadSharedSecrets() {
        Map<TokenAudience, String> secrets = new HashMap<>();
        
        // Load from Portal configuration
        // This secret is shared with Gateway
        String shareSecret = PortalConfiguration.instance.getShareManagementSecret();
        secrets.put(TokenAudience.SHARE, shareSecret);
        
        return secrets;
    }
}
```

---

### **SecretDerivation (Extracted from WOPI)**

```java
package com.ctera.auth.jwt.secrets;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class SecretDerivation {
    /**
     * Derive a secret from master key using HMAC-SHA256.
     * This is the same pattern WOPI uses (line 70-80 of WOPIUtils.java).
     */
    public static String deriveSecret(String masterKey, String context) 
            throws CteraException {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(
                masterKey.getBytes("UTF-8"), 
                "HmacSHA256"
            );
            sha256_HMAC.init(secret_key);
            
            byte[] mac_data = sha256_HMAC.doFinal(context.getBytes("UTF-8"));
            return Utils.bytesToHex(mac_data);
        } catch (Exception e) {
            throw CteraExceptionFactory.create("Secret derivation failed", e);
        }
    }
}
```

---

## 🎭 TokenAudience Enum

```java
package com.ctera.auth.jwt.models;

public enum TokenAudience {
    WOPI("wopi"),           // Office Online (existing)
    MCP("mcp"),             // MCP Filesystem (new)
    SHARE("share"),         // Share Management (Portal ↔ Gateway)
    API("api"),             // Future: Portal REST API v2
    MOBILE("mobile"),       // Future: Mobile apps
    INTEGRATION("integration"), // Future: Third-party integrations
    INTERNAL("internal");   // Future: Service-to-service
    
    private final String value;
    
    TokenAudience(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    public static TokenAudience fromString(String value) {
        for (TokenAudience aud : values()) {
            if (aud.value.equalsIgnoreCase(value)) {
                return aud;
            }
        }
        throw new IllegalArgumentException("Unknown audience: " + value);
    }
}
```

---

## 🔄 MIGRATION PLAN

### **Phase 1: Extract WOPI Code (Week 1)**

- [ ] Create `com.ctera.auth.jwt` package structure
- [ ] Extract JWT generation from WOPIUtils → JwtGenerator
- [ ] Extract JWT validation from WOPIUtils → JwtValidator
- [ ] Create JwtService as main entry point
- [ ] Create SecretProvider interface + implementations
- [ ] **Keep WOPI working**: WOPIUtils delegates to new framework

```java
// WOPIUtils.java (updated to use framework)
public String generateJWTAccessToken(AccessTokenData data, String key) {
    // Use new framework
    JwtService jwtService = new JwtService(
        new PortalSecretProvider(masterKey)
    );
    
    Map<String, Object> claims = new HashMap<>();
    claims.put("fileId", data.getFileId());
    claims.put("shareKey", data.getShareKey());
    // ... other claims
    
    return jwtService.generateToken(
        TokenAudience.WOPI,
        data.getUserId(),
        claims,
        Duration.ofHours(1)  // or whatever WOPI uses
    );
}
```

---

### **Phase 2: Add MCP Support (Week 1-2)**

- [ ] Add `TokenAudience.MCP`
- [ ] Create `JwtAuthorizationBearerValidator` for MCP
- [ ] Plug into bearer auth chain
- [ ] Create `/api/auth/tokens/generate` endpoint
- [ ] Test with n8n node

---

### **Phase 3: Add Share Management Support (Week 2-3)**

- [ ] Add `TokenAudience.SHARE`
- [ ] Create `SharedSecretProvider` for Portal ↔ Gateway
- [ ] Configure shared secret in Portal settings
- [ ] Update Gateway to use JwtValidator with SharedSecretProvider
- [ ] Test Portal → Gateway JWT validation

---

## 📊 USAGE EXAMPLES

### **Example 1: MCP Token Generation**

```java
// Portal Backend - Generate MCP token
JwtService jwtService = new JwtService(
    new PortalSecretProvider(masterKey)
);

Map<String, Object> claims = new HashMap<>();
claims.put("uid", userPrincipal.getUserUid());
claims.put("tenant", userPrincipal.getTenant());

String token = jwtService.generateToken(
    TokenAudience.MCP,
    userPrincipal.getName(),
    claims,
    Duration.ofDays(90)
);
```

---

### **Example 2: Share Management JWT (Portal → Gateway)**

```java
// Portal - Generate share token for Gateway
JwtService jwtService = new JwtService(
    new SharedSecretProvider()  // Uses Portal-Gateway shared secret
);

Map<String, Object> claims = new HashMap<>();
claims.put("shareKey", share.getShareKey());
claims.put("permissions", share.getPermissions());

String token = jwtService.generateToken(
    TokenAudience.SHARE,
    share.getOwner(),
    claims,
    Duration.ofDays(7)
);

// Gateway - Validate share token from Portal
JwtService gatewayJwtService = new JwtService(
    new SharedSecretProvider()  // Same shared secret
);

JwtClaims claims = gatewayJwtService.validateToken(
    token,
    TokenAudience.SHARE
);
```

---

### **Example 3: WOPI (Backward Compatible)**

```java
// WOPI continues to work, now using framework internally
WOPIUtils wopiUtils = new WOPIUtils();
String wopiToken = wopiUtils.generateJWTAccessToken(accessTokenData, key);

// Internally, WOPI delegates to:
// jwtService.generateToken(TokenAudience.WOPI, subject, claims, expiration)
```

---

## ✅ BENEFITS OF THIS DESIGN

| Benefit | Description |
|---------|-------------|
| **Code Reuse** | Extract proven WOPI code, don't reinvent |
| **Consistency** | All JWT operations use same library (jose4j) |
| **Extensibility** | Easy to add new audiences (API, MOBILE, etc.) |
| **Backward Compatible** | WOPI continues working, just delegates to framework |
| **Share Management** | Supports Portal ↔ Gateway shared secret pattern |
| **Type Safe** | TokenAudience enum prevents typos |
| **Testable** | SecretProvider is mockable for tests |
| **Maintainable** | One place for JWT logic, not scattered |

---

## 🎯 ANSWERS TO YOUR QUESTIONS

### **Q1: Can we extract common code from WOPI?**

✅ **YES!** WOPI provides:
- JWT generation pattern (lines 111-145 of WOPIUtils.java)
- JWT validation pattern (lines 83-108 of WOPIUtils.java)
- Secret derivation pattern (lines 70-80 of WOPIUtils.java)
- jose4j usage examples

**Extract and generalize** these patterns into `com.ctera.auth.jwt`.

---

### **Q2: Can this serve share management JWT validation?**

✅ **YES!** Share management needs:
- JWT validation with **shared secret** (Portal and Gateway have same secret)
- Same HMAC-SHA256 algorithm
- Different audience: `"aud": "share"`
- Different claims: `shareKey`, `permissions`

**Solution**: `SharedSecretProvider` handles Portal ↔ Gateway shared secrets, while `PortalSecretProvider` handles derived secrets for other audiences.

---

### **Q3: Audience-only (no scopes)?**

✅ **CONFIRMED!** Start simple:
- Use `aud` claim to differentiate MCP, SHARE, WOPI, API, etc.
- Add fine-grained scopes in Phase 2 when needed
- YAGNI principle - don't over-engineer initially

---

## 🚀 NEXT STEPS

1. ✅ **You approved**: Extract WOPI code, support share management
2. ⏳ **Create** `com.ctera.auth.jwt` package
3. ⏳ **Extract** JWT code from WOPI into framework
4. ⏳ **Add** MCP audience support
5. ⏳ **Add** Share management audience support
6. ⏳ **Update** WOPI to use framework (backward compatible)
7. ⏳ **Test** all three use cases (WOPI, MCP, Share)

**Ready to implement!** 🎉


