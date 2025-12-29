# 🔐 Portal Configuration for Shared Secrets

**Date**: December 28, 2024  
**Purpose**: Document Portal configuration for JWT shared secrets

---

## 🎯 OVERVIEW

The generic JWT framework supports two types of secrets:

1. **Derived Secrets** (Portal-only): Master key → derived per audience
2. **Shared Secrets** (Portal ↔ Gateway/External): Pre-configured shared keys

---

## 📋 SECRET TYPES

| Secret Type | Use Case | Configuration | Derivation |
|-------------|----------|---------------|------------|
| **Master Key** | WOPI, MCP, API, Mobile | Portal variable | HMAC-SHA256(master, audience) |
| **Share Management** | Portal ↔ Gateway | Shared configuration | Direct (no derivation) |

---

## ⚙️ CONFIGURATION METHODS

### **Method 1: Portal Variables (Existing - Master Key)**

**File**: `Portal-Schema/src/main/resources/schema/schema_settings.xml`

```xml
<class name="SystemSettings" table="SystemSettings" entity="true">
    <!-- Existing master key (used by WOPI) -->
    <property name="MasterKey" column="MasterKey" type="string" />
    
    <!-- NEW: Share management shared secret -->
    <property name="ShareManagementSecret" column="ShareManagementSecret" type="string" />
</class>
```

**Portal Configuration** (Java):

```java
// Common/src/main/java/com/ctera/setup/PortalConfiguration.java

public class PortalConfiguration {
    
    /**
     * Get master key for Portal-internal JWT derivation.
     * Used by WOPI, MCP, API audiences.
     */
    public String getMasterKey() {
        // Get from SystemSettings
        return getSystemSettings().getMasterKey();
    }
    
    /**
     * Get shared secret for Portal ↔ Gateway communication.
     * Used by Share Management.
     */
    public String getShareManagementSecret() {
        // Get from SystemSettings
        return getSystemSettings().getShareManagementSecret();
    }
}
```

---

### **Method 2: Environment Variables (Alternative)**

For Docker/Kubernetes deployments:

```bash
# .env or docker-compose.yml
CTERA_MASTER_KEY=abc123...           # Portal master key
CTERA_SHARE_SECRET=shared456...      # Portal ↔ Gateway shared secret
```

**Java Configuration**:

```java
public class PortalConfiguration {
    
    public String getMasterKey() {
        // Try environment variable first, fallback to DB
        String envKey = System.getenv("CTERA_MASTER_KEY");
        if (envKey != null && !envKey.isEmpty()) {
            return envKey;
        }
        return getSystemSettings().getMasterKey();
    }
    
    public String getShareManagementSecret() {
        String envSecret = System.getenv("CTERA_SHARE_SECRET");
        if (envSecret != null && !envSecret.isEmpty()) {
            return envSecret;
        }
        return getSystemSettings().getShareManagementSecret();
    }
}
```

---

### **Method 3: Configuration File (For Gateway)**

**File**: `/etc/ctera/gateway.conf` (Gateway configuration)

```ini
[jwt]
# Shared secret for validating Portal-issued JWTs
share_management_secret = shared456...

# Portal issuer to trust
expected_issuer = ctera-portal

# Expected audience for share tokens
expected_audience = share
```

**Gateway Configuration** (Python/Java):

```python
# Gateway JWT validation
import configparser

config = configparser.ConfigParser()
config.read('/etc/ctera/gateway.conf')

SHARE_SECRET = config['jwt']['share_management_secret']
EXPECTED_ISSUER = config['jwt']['expected_issuer']
EXPECTED_AUDIENCE = config['jwt']['expected_audience']
```

---

## 🔑 SECRET GENERATION

### **Generate Master Key (Portal Setup)**

```bash
# Generate cryptographically secure 256-bit key
openssl rand -hex 32
# Output: abc123def456...
```

**Store in Portal**:
```sql
-- During Portal setup/migration
UPDATE SystemSettings 
SET MasterKey = 'abc123def456...' 
WHERE id = 1;
```

---

### **Generate Shared Secret (Portal ↔ Gateway)**

```bash
# Generate shared secret
openssl rand -hex 32
# Output: shared456xyz789...
```

**Store in Portal**:
```sql
UPDATE SystemSettings 
SET ShareManagementSecret = 'shared456xyz789...' 
WHERE id = 1;
```

**Store in Gateway**:
```bash
# On Gateway server
echo "share_management_secret = shared456xyz789..." >> /etc/ctera/gateway.conf
```

---

## 🏗️ INITIALIZATION FLOW

### **Portal Startup**

```java
// Common/src/main/java/com/ctera/startup/ServicesPortal.java

public class ServicesPortal {
    
    public void initializeJwtFramework() {
        // Load master key
        String masterKey = PortalConfiguration.instance.getMasterKey();
        if (masterKey == null || masterKey.isEmpty()) {
            logger.error("Master key not configured! JWT framework will not work.");
            // Generate new master key
            masterKey = generateMasterKey();
            saveMasterKey(masterKey);
        }
        
        // Load shared secrets
        String shareSecret = PortalConfiguration.instance.getShareManagementSecret();
        if (shareSecret == null || shareSecret.isEmpty()) {
            logger.warn("Share management secret not configured. Share JWT validation will not work.");
        }
        
        // Initialize JWT service
        initializeJwtService(masterKey, shareSecret);
    }
    
    private String generateMasterKey() {
        // Generate secure random key
        SecureRandom random = new SecureRandom();
        byte[] keyBytes = new byte[32];
        random.nextBytes(keyBytes);
        return Utils.bytesToHex(keyBytes);
    }
}
```

---

### **Gateway Startup**

```python
# Gateway initialization
from jwt_validator import JwtValidator

def initialize_gateway():
    # Load shared secret from config
    secret = load_config('jwt', 'share_management_secret')
    
    if not secret:
        raise RuntimeError("Share management secret not configured!")
    
    # Initialize JWT validator
    validator = JwtValidator(
        secret=secret,
        expected_issuer='ctera-portal',
        expected_audience='share'
    )
    
    return validator
```

---

## 🔄 SECRET ROTATION

### **Rotating Master Key**

**Problem**: Rotating master key invalidates all derived secrets (WOPI, MCP, API tokens).

**Solution**: Dual-key validation period

```java
public class PortalSecretProvider implements SecretProvider {
    private final String currentMasterKey;
    private final String previousMasterKey;  // For rotation grace period
    
    @Override
    public String getSecret(TokenAudience audience) throws CteraException {
        // Always use current key for generation
        return SecretDerivation.deriveSecret(currentMasterKey, audience.getValue());
    }
    
    public boolean validateWithBothKeys(String token, TokenAudience audience) {
        // Try current key first
        try {
            validate(token, audience, currentMasterKey);
            return true;
        } catch (JwtAuthenticationException e) {
            // Fallback to previous key during rotation
            if (previousMasterKey != null) {
                try {
                    validate(token, audience, previousMasterKey);
                    logger.warn("Token validated with previous key - rotation in progress");
                    return true;
                } catch (JwtAuthenticationException e2) {
                    throw e2;
                }
            }
            throw e;
        }
    }
}
```

**Rotation Process**:
1. Generate new master key
2. Store as `MasterKeyNew` in SystemSettings
3. Keep `MasterKey` (old) for 7 days (grace period)
4. After 7 days, move `MasterKeyNew` → `MasterKey`
5. Delete `MasterKeyNew`

---

### **Rotating Shared Secret (Portal ↔ Gateway)**

**Process**:
1. **Day 0**: Generate new shared secret
2. **Day 0**: Update Gateway config with new secret
3. **Day 1**: Update Portal config with new secret
4. **Day 1-7**: Both Portal and Gateway support dual validation
5. **Day 7**: Remove old secret

**Configuration During Rotation**:

```ini
# Gateway config (supports two secrets during rotation)
[jwt]
share_management_secret = new_secret_789...
share_management_secret_old = old_secret_456...
rotation_grace_period_days = 7
```

---

## 🧪 TESTING CONFIGURATION

### **Verify Master Key**

```bash
# Test that master key is configured
curl -k https://portal.company.com/admin/diagnostics/jwt-config

# Expected response:
{
  "master_key_configured": true,
  "master_key_length": 64,
  "share_secret_configured": true,
  "supported_audiences": ["wopi", "mcp", "share", "api", "mobile"]
}
```

---

### **Test JWT Generation**

```bash
# Generate test MCP token
curl -k -X POST https://portal.company.com/api/auth/tokens/generate \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "audience": "mcp",
    "lifetime_days": 90
  }'

# Expected response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2025-03-28T10:00:00Z",
  "audience": "mcp"
}
```

---

### **Test JWT Validation**

```bash
# Validate MCP token
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -k -X POST https://portal.company.com/api/auth/tokens/validate \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"audience\": \"mcp\"
  }"

# Expected response:
{
  "valid": true,
  "subject": "admin@company.com",
  "audience": "mcp",
  "expires_at": "2025-03-28T10:00:00Z",
  "claims": {
    "uid": 1,
    "tenant": "default"
  }
}
```

---

## 📋 DEPLOYMENT CHECKLIST

### **Portal Deployment**
- [ ] Master key generated and stored
- [ ] Share management secret generated and stored
- [ ] SystemSettings table has new columns
- [ ] PortalConfiguration updated
- [ ] JWT framework initialized on startup
- [ ] Test endpoints available (dev/test only)

### **Gateway Deployment**
- [ ] Share management secret configured
- [ ] gateway.conf updated
- [ ] JWT validator initialized
- [ ] Test validation with Portal-issued token
- [ ] Monitoring/logging configured

### **Security Checklist**
- [ ] Secrets stored securely (not in version control)
- [ ] Secrets not logged
- [ ] Rotation procedure documented
- [ ] Grace period for rotation configured
- [ ] Access to secrets restricted

---

## 🔒 SECURITY BEST PRACTICES

### **1. Secret Storage**

✅ **DO**:
- Store in database (encrypted at rest)
- Use environment variables in containers
- Use secrets management (Vault, AWS Secrets Manager)
- Restrict file permissions (0600)

❌ **DON'T**:
- Hardcode in source code
- Commit to version control
- Log secrets in application logs
- Store in plain text files

---

### **2. Secret Generation**

✅ **DO**:
- Use cryptographically secure random (openssl rand)
- Minimum 256 bits (32 bytes)
- Hex encoding for storage

❌ **DON'T**:
- Use predictable patterns
- Use short keys (<128 bits)
- Reuse secrets across environments

---

### **3. Secret Access**

✅ **DO**:
- Restrict to Portal/Gateway processes only
- Use principle of least privilege
- Audit secret access
- Monitor for unauthorized access

❌ **DON'T**:
- Expose in APIs
- Share between environments (dev/prod)
- Store in client-side code

---

## 📊 CONFIGURATION MATRIX

| Environment | Master Key Source | Share Secret Source | Rotation Policy |
|-------------|-------------------|---------------------|-----------------|
| **Development** | Environment var | Config file | Manual |
| **Staging** | Database | Database | 90 days |
| **Production** | Vault/Secrets Manager | Vault/Secrets Manager | 90 days with grace period |

---

## 🚀 QUICK START

### **1. Portal Setup**

```bash
# Generate secrets
MASTER_KEY=$(openssl rand -hex 32)
SHARE_SECRET=$(openssl rand -hex 32)

# Store in Portal
psql portal_db <<EOF
UPDATE SystemSettings 
SET MasterKey = '$MASTER_KEY',
    ShareManagementSecret = '$SHARE_SECRET'
WHERE id = 1;
EOF
```

### **2. Gateway Setup**

```bash
# Configure Gateway
cat > /etc/ctera/gateway.conf <<EOF
[jwt]
share_management_secret = $SHARE_SECRET
expected_issuer = ctera-portal
expected_audience = share
EOF

chmod 600 /etc/ctera/gateway.conf
```

### **3. Test**

```bash
# From Portal, generate share token
TOKEN=$(curl -k -X POST https://portal.company.com/api/auth/tokens/generate \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d '{"audience":"share","lifetime_days":7}' | jq -r '.token')

# From Gateway, validate token
# (Gateway code validates using shared secret)
```

---

## ✅ COMPLETION CRITERIA

- [ ] Master key configured in Portal
- [ ] Share secret configured in Portal and Gateway
- [ ] Both secrets are 256-bit random values
- [ ] Secrets stored securely
- [ ] JWT generation works for all audiences
- [ ] JWT validation works for all audiences
- [ ] Rotation procedure tested
- [ ] Documentation complete

**Configuration ready!** 🎉

