# 🔧 WOPI Code Extraction Implementation Plan

**Date**: December 28, 2024  
**Purpose**: Step-by-step plan to extract WOPI JWT code into generic framework

---

## 🎯 OBJECTIVES

1. Create generic `com.ctera.auth.jwt` framework
2. Extract JWT code from `WOPIUtils.java` 
3. Keep WOPI backward compatible
4. Support MCP and Share Management
5. All changes tested and deployable

---

## 📋 IMPLEMENTATION PHASES

### **Phase 1: Create Framework Structure** (Day 1-2)

#### **Task 1.1: Create Package Structure**

```bash
mkdir -p Common/src/main/java/com/ctera/auth/jwt/{core,models,secrets,validators,exceptions}
mkdir -p Common/src/test/java/com/ctera/auth/jwt/{core,secrets,validators}
```

**Files to create**:
- [ ] `com/ctera/auth/jwt/core/JwtService.java`
- [ ] `com/ctera/auth/jwt/core/JwtGenerator.java`
- [ ] `com/ctera/auth/jwt/core/JwtValidator.java`
- [ ] `com/ctera/auth/jwt/core/JwtConfig.java`
- [ ] `com/ctera/auth/jwt/models/TokenAudience.java`
- [ ] `com/ctera/auth/jwt/models/JwtClaims.java`
- [ ] `com/ctera/auth/jwt/models/JwtToken.java`
- [ ] `com/ctera/auth/jwt/secrets/SecretProvider.java`
- [ ] `com/ctera/auth/jwt/secrets/PortalSecretProvider.java`
- [ ] `com/ctera/auth/jwt/secrets/SharedSecretProvider.java`
- [ ] `com/ctera/auth/jwt/secrets/SecretDerivation.java`
- [ ] `com/ctera/auth/jwt/exceptions/JwtAuthenticationException.java`
- [ ] `com/ctera/auth/jwt/exceptions/TokenExpiredException.java`
- [ ] `com/ctera/auth/jwt/exceptions/InvalidAudienceException.java`

---

#### **Task 1.2: Create TokenAudience Enum**

**File**: `Common/src/main/java/com/ctera/auth/jwt/models/TokenAudience.java`

```java
package com.ctera.auth.jwt.models;

public enum TokenAudience {
    WOPI("wopi"),
    MCP("mcp"),
    SHARE("share"),
    API("api"),
    MOBILE("mobile"),
    INTEGRATION("integration"),
    INTERNAL("internal");
    
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

**Test**: `TokenAudienceTest.java`
- [ ] Test fromString() conversion
- [ ] Test getValue() returns correct string
- [ ] Test invalid audience throws exception

---

#### **Task 1.3: Create SecretProvider Interface**

**File**: `Common/src/main/java/com/ctera/auth/jwt/secrets/SecretProvider.java`

```java
package com.ctera.auth.jwt.secrets;

import com.ctera.auth.jwt.models.TokenAudience;
import com.ctera.exception.CteraException;

public interface SecretProvider {
    /**
     * Get the secret for a specific audience.
     * @param audience The token audience
     * @return The secret key for signing/validating JWTs
     * @throws CteraException if secret cannot be retrieved
     */
    String getSecret(TokenAudience audience) throws CteraException;
    
    /**
     * Check if this provider can provide secret for given audience.
     * @param audience The token audience
     * @return true if this provider supports the audience
     */
    boolean supportsAudience(TokenAudience audience);
}
```

---

### **Phase 2: Extract Secret Derivation from WOPI** (Day 2-3)

#### **Task 2.1: Create SecretDerivation**

**Extract from**: `WOPIUtils.java` lines 70-80

**File**: `Common/src/main/java/com/ctera/auth/jwt/secrets/SecretDerivation.java`

```java
package com.ctera.auth.jwt.secrets;

import com.ctera.exception.CteraException;
import com.ctera.exception.CteraExceptionFactory;
import com.ctera.utils.Utils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.io.UnsupportedEncodingException;

public class SecretDerivation {
    
    /**
     * Derive a secret from master key using HMAC-SHA256.
     * This is the pattern used by WOPI (generateOfficeKey).
     * 
     * @param masterKey The master key to derive from
     * @param context The context string (e.g., "office", "mcp", "api")
     * @return Hex-encoded derived secret
     * @throws CteraException if derivation fails
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
        } catch (NoSuchAlgorithmException | UnsupportedEncodingException | InvalidKeyException e) {
            throw CteraExceptionFactory.create("Secret derivation failed", e);
        }
    }
}
```

**Tests**: `SecretDerivationTest.java`
- [ ] Test known input/output from WOPI
- [ ] Test null masterKey throws exception
- [ ] Test empty context string
- [ ] Test special characters in context

---

#### **Task 2.2: Create PortalSecretProvider**

**File**: `Common/src/main/java/com/ctera/auth/jwt/secrets/PortalSecretProvider.java`

```java
package com.ctera.auth.jwt.secrets;

import com.ctera.auth.jwt.models.TokenAudience;
import com.ctera.exception.CteraException;
import com.ctera.logging.CteraLogger;

import java.util.EnumSet;
import java.util.Set;

/**
 * Provides secrets derived from Portal master key.
 * Uses HMAC-SHA256 derivation (WOPI pattern).
 */
public class PortalSecretProvider implements SecretProvider {
    private static final CteraLogger logger = CteraLogger.getLogger(PortalSecretProvider.class);
    
    private static final Set<TokenAudience> SUPPORTED_AUDIENCES = EnumSet.of(
        TokenAudience.WOPI,
        TokenAudience.MCP,
        TokenAudience.API,
        TokenAudience.MOBILE,
        TokenAudience.INTEGRATION,
        TokenAudience.INTERNAL
    );
    
    private final String masterKey;
    
    public PortalSecretProvider(String masterKey) {
        if (masterKey == null || masterKey.isEmpty()) {
            throw new IllegalArgumentException("Master key cannot be null or empty");
        }
        this.masterKey = masterKey;
    }
    
    @Override
    public String getSecret(TokenAudience audience) throws CteraException {
        if (!supportsAudience(audience)) {
            throw new CteraException("Unsupported audience for Portal secret: " + audience);
        }
        
        logger.debug("Deriving secret for audience: {}", audience.getValue());
        return SecretDerivation.deriveSecret(masterKey, audience.getValue());
    }
    
    @Override
    public boolean supportsAudience(TokenAudience audience) {
        return SUPPORTED_AUDIENCES.contains(audience);
    }
}
```

**Tests**: `PortalSecretProviderTest.java`
- [ ] Test WOPI secret matches existing WOPI behavior
- [ ] Test MCP secret derivation
- [ ] Test unsupported audience (SHARE) throws exception
- [ ] Test null master key throws exception

---

#### **Task 2.3: Create SharedSecretProvider**

**File**: `Common/src/main/java/com/ctera/auth/jwt/secrets/SharedSecretProvider.java`

```java
package com.ctera.auth.jwt.secrets;

import com.ctera.auth.jwt.models.TokenAudience;
import com.ctera.exception.CteraException;
import com.ctera.logging.CteraLogger;
import com.ctera.setup.PortalConfiguration;

import java.util.HashMap;
import java.util.Map;

/**
 * Provides shared secrets for Portal ↔ Gateway communication.
 * These are NOT derived, but configured directly.
 */
public class SharedSecretProvider implements SecretProvider {
    private static final CteraLogger logger = CteraLogger.getLogger(SharedSecretProvider.class);
    
    private final Map<TokenAudience, String> sharedSecrets;
    
    public SharedSecretProvider() {
        this.sharedSecrets = loadSharedSecrets();
    }
    
    // For testing
    SharedSecretProvider(Map<TokenAudience, String> secrets) {
        this.sharedSecrets = secrets;
    }
    
    @Override
    public String getSecret(TokenAudience audience) throws CteraException {
        String secret = sharedSecrets.get(audience);
        if (secret == null) {
            throw new CteraException("No shared secret configured for audience: " + audience);
        }
        logger.debug("Retrieved shared secret for audience: {}", audience.getValue());
        return secret;
    }
    
    @Override
    public boolean supportsAudience(TokenAudience audience) {
        return sharedSecrets.containsKey(audience);
    }
    
    private Map<TokenAudience, String> loadSharedSecrets() {
        Map<TokenAudience, String> secrets = new HashMap<>();
        
        // Load share management secret (Portal ↔ Gateway)
        try {
            String shareSecret = PortalConfiguration.instance.getShareManagementSecret();
            if (shareSecret != null && !shareSecret.isEmpty()) {
                secrets.put(TokenAudience.SHARE, shareSecret);
                logger.info("Loaded share management shared secret");
            }
        } catch (Exception e) {
            logger.warn("Failed to load share management secret: {}", e.getMessage());
        }
        
        // Future: Add other shared secrets here
        
        return secrets;
    }
}
```

**Tests**: `SharedSecretProviderTest.java`
- [ ] Test SHARE secret retrieval
- [ ] Test unsupported audience returns false
- [ ] Test missing secret throws exception

---

### **Phase 3: Extract JWT Generation from WOPI** (Day 3-4)

#### **Task 3.1: Create JwtGenerator**

**Extract from**: `WOPIUtils.java` lines 111-145

**File**: `Common/src/main/java/com/ctera/auth/jwt/core/JwtGenerator.java`

```java
package com.ctera.auth.jwt.core;

import com.ctera.auth.jwt.models.TokenAudience;
import com.ctera.auth.jwt.secrets.SecretProvider;
import com.ctera.exception.CteraException;
import com.ctera.exception.CteraExceptionFactory;
import com.ctera.logging.CteraLogger;
import com.ctera.security.SecurityUtils;

import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.NumericDate;
import org.jose4j.keys.HmacKey;

import java.security.Key;
import java.time.Duration;
import java.util.Map;

/**
 * Generates JWT tokens using HMAC-SHA256.
 * Extracted from WOPIUtils.generateJWTAccessToken.
 */
public class JwtGenerator {
    private static final CteraLogger logger = CteraLogger.getLogger(JwtGenerator.class);
    private static final String ISSUER = "ctera-portal";
    
    private final SecretProvider secretProvider;
    
    public JwtGenerator(SecretProvider secretProvider) {
        this.secretProvider = secretProvider;
    }
    
    /**
     * Generate a JWT token.
     * 
     * @param audience The token audience
     * @param subject The token subject (user identifier)
     * @param customClaims Additional claims to include
     * @param expiration Token expiration duration (null = no expiration)
     * @return Compact serialized JWT
     * @throws CteraException if generation fails
     */
    public String generate(TokenAudience audience,
                          String subject,
                          Map<String, Object> customClaims,
                          Duration expiration) throws CteraException {
        try {
            // Get secret for this audience
            String secret = secretProvider.getSecret(audience);
            Key key = new HmacKey(secret.getBytes("UTF-8"));
            
            // Update HMAC algorithms (same as WOPI)
            SecurityUtils.updateHMacAlgorithms();
            
            // Build claims
            JwtClaims claims = new JwtClaims();
            claims.setIssuer(ISSUER);
            claims.setAudience(audience.getValue());
            claims.setSubject(subject);
            claims.setIssuedAtToNow();
            
            // Set expiration if provided
            if (expiration != null) {
                NumericDate expirationTime = NumericDate.fromMilliseconds(
                    System.currentTimeMillis() + expiration.toMillis()
                );
                claims.setExpirationTime(expirationTime);
            }
            
            // Add custom claims
            if (customClaims != null) {
                for (Map.Entry<String, Object> entry : customClaims.entrySet()) {
                    if (entry.getValue() != null) {
                        claims.setClaim(entry.getKey(), entry.getValue());
                    }
                }
            }
            
            // Sign (same as WOPI)
            JsonWebSignature jws = new JsonWebSignature();
            jws.setPayload(claims.toJson());
            jws.setKey(key);
            jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.HMAC_SHA256);
            
            String token = jws.getCompactSerialization();
            logger.debug("Generated JWT for audience: {}, subject: {}", 
                        audience.getValue(), subject);
            
            return token;
        } catch (Exception e) {
            logger.error("JWT generation failed for audience: {}", audience, e);
            throw CteraExceptionFactory.create("JWT generation failed", e);
        }
    }
}
```

**Tests**: `JwtGeneratorTest.java`
- [ ] Test WOPI token generation matches existing behavior
- [ ] Test MCP token generation
- [ ] Test with/without expiration
- [ ] Test with/without custom claims
- [ ] Test token can be decoded

---

### **Phase 4: Extract JWT Validation from WOPI** (Day 4-5)

#### **Task 4.1: Create JwtClaims Model**

**File**: `Common/src/main/java/com/ctera/auth/jwt/models/JwtClaims.java`

```java
package com.ctera.auth.jwt.models;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Represents validated JWT claims.
 */
public class JwtClaims {
    private final String issuer;
    private final String audience;
    private final String subject;
    private final Date issuedAt;
    private final Date expiration;
    private final Map<String, Object> customClaims;
    
    public JwtClaims(String issuer, String audience, String subject, 
                    Date issuedAt, Date expiration, 
                    Map<String, Object> customClaims) {
        this.issuer = issuer;
        this.audience = audience;
        this.subject = subject;
        this.issuedAt = issuedAt;
        this.expiration = expiration;
        this.customClaims = customClaims != null ? customClaims : new HashMap<>();
    }
    
    public String getIssuer() { return issuer; }
    public String getAudience() { return audience; }
    public String getSubject() { return subject; }
    public Date getIssuedAt() { return issuedAt; }
    public Date getExpiration() { return expiration; }
    
    public Object getClaim(String name) {
        return customClaims.get(name);
    }
    
    public <T> T getClaim(String name, Class<T> type) {
        Object value = customClaims.get(name);
        if (value == null) return null;
        return type.cast(value);
    }
    
    public boolean hasClaim(String name) {
        return customClaims.containsKey(name);
    }
    
    public Map<String, Object> getAllClaims() {
        return new HashMap<>(customClaims);
    }
}
```

---

#### **Task 4.2: Create JwtValidator**

**Extract from**: `WOPIUtils.java` lines 83-108

**File**: `Common/src/main/java/com/ctera/auth/jwt/core/JwtValidator.java`

```java
package com.ctera.auth.jwt.core;

import com.ctera.auth.jwt.exceptions.InvalidAudienceException;
import com.ctera.auth.jwt.exceptions.JwtAuthenticationException;
import com.ctera.auth.jwt.exceptions.TokenExpiredException;
import com.ctera.auth.jwt.models.TokenAudience;
import com.ctera.auth.jwt.secrets.SecretProvider;
import com.ctera.logging.CteraLogger;

import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.HmacKey;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Validates JWT tokens using HMAC-SHA256.
 * Extracted from WOPIUtils.validateJWTAccessToken.
 */
public class JwtValidator {
    private static final CteraLogger logger = CteraLogger.getLogger(JwtValidator.class);
    private static final String ISSUER = "ctera-portal";
    
    private final SecretProvider secretProvider;
    
    public JwtValidator(SecretProvider secretProvider) {
        this.secretProvider = secretProvider;
    }
    
    /**
     * Validate a JWT token.
     * 
     * @param token The JWT token to validate
     * @param audience The expected audience
     * @return Validated claims
     * @throws JwtAuthenticationException if validation fails
     */
    public com.ctera.auth.jwt.models.JwtClaims validate(String token, TokenAudience audience) 
            throws JwtAuthenticationException {
        if (token == null || token.isEmpty()) {
            throw new JwtAuthenticationException("Token is null or empty");
        }
        
        try {
            // Get secret for this audience
            String secret = secretProvider.getSecret(audience);
            Key key = new HmacKey(secret.getBytes("UTF-8"));
            
            // Build consumer (same pattern as WOPI)
            JwtConsumer consumer = new JwtConsumerBuilder()
                .setRequireSubject()
                .setExpectedIssuer(ISSUER)
                .setExpectedAudience(audience.getValue())
                .setVerificationKey(key)
                .setRequireExpirationTime()  // Can be configured per audience
                .build();
            
            // Validate
            org.jose4j.jwt.JwtClaims jose4jClaims = consumer.processToClaims(token);
            
            // Convert to our model
            com.ctera.auth.jwt.models.JwtClaims claims = convertClaims(jose4jClaims);
            
            logger.debug("Validated JWT for audience: {}, subject: {}", 
                        audience.getValue(), claims.getSubject());
            
            return claims;
            
        } catch (InvalidJwtException e) {
            if (e.getMessage().contains("expired")) {
                throw new TokenExpiredException("JWT token has expired", e);
            } else if (e.getMessage().contains("audience")) {
                throw new InvalidAudienceException("Invalid JWT audience", e);
            } else {
                throw new JwtAuthenticationException("Invalid JWT: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            logger.error("JWT validation failed for audience: {}", audience, e);
            throw new JwtAuthenticationException("JWT validation failed", e);
        }
    }
    
    private com.ctera.auth.jwt.models.JwtClaims convertClaims(org.jose4j.jwt.JwtClaims jose4jClaims) {
        try {
            String issuer = jose4jClaims.getIssuer();
            String audience = (String) jose4jClaims.getAudience().get(0);
            String subject = jose4jClaims.getSubject();
            Date issuedAt = jose4jClaims.getIssuedAt() != null ? 
                           new Date(jose4jClaims.getIssuedAt().getValueInMillis()) : null;
            Date expiration = jose4jClaims.getExpirationTime() != null ?
                             new Date(jose4jClaims.getExpirationTime().getValueInMillis()) : null;
            
            // Extract custom claims
            Map<String, Object> customClaims = new HashMap<>();
            for (String claimName : jose4jClaims.getClaimNames()) {
                if (!isStandardClaim(claimName)) {
                    customClaims.put(claimName, jose4jClaims.getClaimValue(claimName));
                }
            }
            
            return new com.ctera.auth.jwt.models.JwtClaims(
                issuer, audience, subject, issuedAt, expiration, customClaims
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert JWT claims", e);
        }
    }
    
    private boolean isStandardClaim(String claimName) {
        return claimName.equals("iss") || claimName.equals("aud") || 
               claimName.equals("sub") || claimName.equals("iat") || 
               claimName.equals("exp") || claimName.equals("jti") ||
               claimName.equals("nbf");
    }
}
```

**Tests**: `JwtValidatorTest.java`
- [ ] Test valid WOPI token
- [ ] Test expired token throws TokenExpiredException
- [ ] Test wrong audience throws InvalidAudienceException
- [ ] Test tampered signature fails
- [ ] Test null token throws exception

---

### **Phase 5: Create JwtService** (Day 5)

#### **Task 5.1: Create Main Service**

**File**: `Common/src/main/java/com/ctera/auth/jwt/core/JwtService.java`

```java
package com.ctera.auth.jwt.core;

import com.ctera.auth.jwt.exceptions.JwtAuthenticationException;
import com.ctera.auth.jwt.models.JwtClaims;
import com.ctera.auth.jwt.models.TokenAudience;
import com.ctera.auth.jwt.secrets.SecretProvider;
import com.ctera.exception.CteraException;

import java.time.Duration;
import java.util.Map;

/**
 * Main entry point for JWT operations.
 * Provides high-level API for token generation and validation.
 */
public class JwtService {
    private final JwtGenerator generator;
    private final JwtValidator validator;
    
    public JwtService(SecretProvider secretProvider) {
        this.generator = new JwtGenerator(secretProvider);
        this.validator = new JwtValidator(secretProvider);
    }
    
    /**
     * Generate a JWT token.
     */
    public String generateToken(TokenAudience audience,
                               String subject,
                               Map<String, Object> claims,
                               Duration expiration) throws CteraException {
        return generator.generate(audience, subject, claims, expiration);
    }
    
    /**
     * Validate a JWT token.
     */
    public JwtClaims validateToken(String token, TokenAudience audience) 
            throws JwtAuthenticationException {
        return validator.validate(token, audience);
    }
}
```

---

### **Phase 6: Update WOPI to Use Framework** (Day 6)

#### **Task 6.1: Update WOPIUtils**

**File**: `Common/src/main/java/com/ctera/fileViewAndEdit/officeOnline/WOPIUtils.java`

```java
// Add imports
import com.ctera.auth.jwt.core.JwtService;
import com.ctera.auth.jwt.models.TokenAudience;
import com.ctera.auth.jwt.models.JwtClaims;
import com.ctera.auth.jwt.secrets.PortalSecretProvider;

public class WOPIUtils {
    
    // Keep existing methods but delegate to framework
    
    public String generateJWTAccessToken(AccessTokenData accessTokenData, String key)
            throws CteraException {
        // Use new framework
        JwtService jwtService = new JwtService(
            new PortalSecretProvider(getMasterKey())
        );
        
        Map<String, Object> claims = new HashMap<>();
        claims.put(WOPIConstants.FILE_ID_KEY, accessTokenData.getFileId());
        claims.put(WOPIConstants.SNAPSHOT_ID, accessTokenData.getSnapshotId());
        claims.put(WOPIConstants.DELETED_ID, accessTokenData.isDeleted());
        
        if (accessTokenData.getShareKey() != null) {
            claims.put(WOPIConstants.SHARE_KEY, accessTokenData.getShareKey());
        }
        if (accessTokenData.getHost() != null) {
            claims.put(WOPIConstants.HOST_KEY, accessTokenData.getHost());
        }
        if (accessTokenData.getUpn() != null) {
            claims.put(WOPIConstants.UPN_KEY, accessTokenData.getUpn());
        }
        if (accessTokenData.getEMail() != null) {
            claims.put(WOPIConstants.EMAIL_KEY, accessTokenData.getEMail());
        }
        
        return jwtService.generateToken(
            TokenAudience.WOPI,
            accessTokenData.getUserId(),
            claims,
            null  // WOPI doesn't use expiration currently
        );
    }
    
    public AccessTokenData validateJWTAccessToken(String accessToken, String key) 
            throws CteraException {
        // Use new framework
        JwtService jwtService = new JwtService(
            new PortalSecretProvider(getMasterKey())
        );
        
        JwtClaims claims = jwtService.validateToken(accessToken, TokenAudience.WOPI);
        
        // Convert to AccessTokenData
        String upn = claims.getClaim(WOPIConstants.UPN_KEY, String.class);
        String email = claims.getClaim(WOPIConstants.EMAIL_KEY, String.class);
        String host = claims.getClaim(WOPIConstants.HOST_KEY, String.class);
        String shareKey = claims.getClaim(WOPIConstants.SHARE_KEY, String.class);
        Long snapshotId = claims.getClaim(WOPIConstants.SNAPSHOT_ID, Long.class);
        Boolean isDeleted = claims.getClaim(WOPIConstants.DELETED_ID, Boolean.class);
        String fileId = claims.getClaim(WOPIConstants.FILE_ID_KEY, String.class);
        
        return new AccessTokenData(
            claims.getSubject(), fileId, shareKey,
            snapshotId, upn, email, host,
            isDeleted != null && isDeleted
        );
    }
    
    private String getMasterKey() {
        // Get master key from configuration
        // (existing WOPI logic)
    }
}
```

**Tests**: Update existing WOPI tests to ensure backward compatibility
- [ ] All existing WOPI tests still pass
- [ ] Token format unchanged
- [ ] Validation logic unchanged

---

### **Phase 7: Add MCP Support** (Day 7-8)

#### **Task 7.1: Create JwtAuthorizationBearerValidator**

**File**: `Common/src/main/java/com/ctera/auth/jwt/validators/JwtAuthorizationBearerValidator.java`

```java
package com.ctera.auth.jwt.validators;

import com.ctera.auth.jwt.core.JwtService;
import com.ctera.auth.jwt.models.JwtClaims;
import com.ctera.auth.jwt.models.TokenAudience;
import com.ctera.auth.jwt.secrets.PortalSecretProvider;
import com.ctera.jaas.UserPrincipal;
import com.ctera.logging.CteraLogger;
import com.ctera.spring.shared.authorization.validators.AuthorizationBearerValidator;
import com.ctera.utils.UserUtils;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class JwtAuthorizationBearerValidator implements AuthorizationBearerValidator {
    private static final CteraLogger logger = CteraLogger.getLogger(JwtAuthorizationBearerValidator.class);
    
    private final JwtService jwtService;
    
    public JwtAuthorizationBearerValidator() {
        // Initialize with Portal secret provider
        String masterKey = getMasterKeyFromConfig();
        this.jwtService = new JwtService(new PortalSecretProvider(masterKey));
    }
    
    @Override
    public Optional<UserPrincipal> getUserPrincipal(String authorizationBearer) {
        try {
            // Try MCP audience first (most common for this validator)
            JwtClaims claims = jwtService.validateToken(authorizationBearer, TokenAudience.MCP);
            
            // Extract user info from claims
            Long uid = claims.getClaim("uid", Long.class);
            if (uid == null) {
                // Fallback: look up user by subject (email/username)
                return getUserPrincipalBySubject(claims.getSubject());
            }
            
            // Create UserPrincipal from uid
            UserUtils userUtils = new UserUtils();
            UserPrincipal userPrincipal = userUtils.createUserPrincipal(uid, null);
            
            logger.debug("Validated MCP JWT for user: {}", claims.getSubject());
            return Optional.ofNullable(userPrincipal);
            
        } catch (Exception e) {
            logger.debug("JWT validation failed: {}", e.getMessage());
            return Optional.empty();
        }
    }
    
    private Optional<UserPrincipal> getUserPrincipalBySubject(String subject) {
        // Implementation for looking up user by email/username
        // (similar to OAuth2JwtBearerValidator)
        return Optional.empty();
    }
    
    private String getMasterKeyFromConfig() {
        // Get master key from Portal configuration
        // (same place WOPI gets it)
        return null;
    }
}
```

---

### **Phase 8: Testing & Validation** (Day 9-10)

#### **Task 8.1: Unit Tests**
- [ ] Run all tests: `./gradlew test --tests "com.ctera.auth.jwt.*"`
- [ ] Verify 100% code coverage for core classes
- [ ] Verify no regressions in WOPI tests

#### **Task 8.2: Integration Tests**
- [ ] Test WOPI flow end-to-end
- [ ] Test MCP token generation → validation
- [ ] Test Share Management token generation → validation
- [ ] Test wrong audience rejection

#### **Task 8.3: Security Review**
- [ ] Verify signature validation cannot be bypassed
- [ ] Verify expiration is enforced
- [ ] Verify audience validation is strict
- [ ] Verify secrets are not logged

---

## ✅ COMPLETION CHECKLIST

### **Code Complete**
- [ ] All 13 new classes created
- [ ] WOPI updated to use framework
- [ ] MCP validator created
- [ ] All tests passing
- [ ] No regressions

### **Documentation Complete**
- [ ] JavaDoc for all public methods
- [ ] README for framework usage
- [ ] Migration guide for future audiences
- [ ] Architecture diagram

### **Deployment Ready**
- [ ] Code reviewed
- [ ] Security reviewed
- [ ] Performance tested
- [ ] Backward compatibility verified
- [ ] Portal configuration documented

---

## 📊 ESTIMATED TIMELINE

| Phase | Duration | Status |
|-------|----------|--------|
| Framework structure | 2 days | 📋 Planned |
| Secret derivation | 1 day | 📋 Planned |
| JWT generation | 1 day | 📋 Planned |
| JWT validation | 1 day | 📋 Planned |
| JwtService | 0.5 days | 📋 Planned |
| Update WOPI | 1 day | 📋 Planned |
| Add MCP support | 2 days | 📋 Planned |
| Testing | 2 days | 📋 Planned |
| **Total** | **10.5 days** | **~2 weeks** |

---

## 🎯 SUCCESS CRITERIA

1. ✅ WOPI continues working (no regressions)
2. ✅ MCP can generate and validate tokens
3. ✅ Share Management can validate tokens
4. ✅ All tests passing
5. ✅ Code reviewed and approved
6. ✅ Documentation complete

**Ready to start implementation!** 🚀

