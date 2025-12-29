# 🔧 nginx Dual Authentication Solution

**Date**: December 28, 2024  
**Purpose**: Add Portal JWT authentication path while keeping oauth2-proxy for IdP

---

## 🎯 CURRENT STATE (From ctera.conf)

### **Existing MCP Endpoint**:

```nginx
location = /_SRV/MCP/mcp {
    # Returns 204 for non-POST (health checks)
    if ($request_method !~ ^(POST)$) {
        return 204;
    }
    
    # --- OAuth2 Proxy Authentication ---
    auth_request                /auth;
    error_page                  401 = @oauth2_redirect;
    auth_request_set            $user_email $upstream_http_x_auth_request_email;
    auth_request_set            $access_token $upstream_http_x_auth_request_access_token;

    # --- Forward user identity to upstream ---
    proxy_set_header            X-Forwarded-User    $user_email;
    proxy_set_header            Authorization       "Bearer $access_token";
    
    # --- Proxy to Envoy ---
    proxy_pass                  http://envoy/_SRV/MCP/mcp/;
}
```

**Flow**:
```
Request → nginx → oauth2_proxy → nginx → envoy → MCP Python Service
                      ↓
                 Validates with IdP
                 Returns user_email + access_token
```

---

## 🚀 PROPOSED SOLUTION: Add Portal JWT Detection

### **Strategy**: Use `map` directive to detect Portal-issued JWTs

Portal JWTs have specific characteristics:
- Issuer: `"iss":"ctera-portal"`
- Audience: `"aud":"mcp"`
- Specific claims structure

We'll detect these and route accordingly.

---

## 📝 IMPLEMENTATION

### **Step 1: Add JWT Detection Map**

Add this in the `http` block (before server blocks):

```nginx
http {
    # ... existing config ...
    
    # =============================================================================
    # PORTAL JWT DETECTION
    # =============================================================================
    
    # Detect if Authorization header contains a Portal-issued JWT
    # Portal JWTs are identified by a custom header X-Portal-JWT
    map $http_x_portal_jwt $is_portal_jwt {
        default                 0;
        "~^.+$"                1;  # If X-Portal-JWT header exists and non-empty
    }
    
    # ... rest of config ...
}
```

**Rationale**: 
- Simple detection via custom header `X-Portal-JWT`
- n8n node sends this header when using Portal JWT
- No false positives (oauth2_proxy traffic won't have this header)

---

### **Step 2: Add Portal JWT Location Block**

Add this BEFORE the existing `/_SRV/MCP/mcp` location:

```nginx
server {
    # ... existing config ...
    
    # =============================================================================
    # MCP WITH PORTAL JWT (Non-Interactive Automation)
    # =============================================================================
    
    location @mcp_portal_jwt {
        # Internal location - called only when Portal JWT detected
        
        # --- Forward to Portal Backend for JWT validation ---
        proxy_pass                  http://tomcat/_SRV/MCP/mcp$is_args$args;
        
        # --- Standard proxy headers ---
        proxy_set_header            Host                $host;
        proxy_set_header            X-Real-IP           $remote_addr;
        proxy_set_header            X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header            X-Forwarded-Proto   $scheme;
        
        # --- Forward Authorization header (contains Portal JWT) ---
        proxy_set_header            Authorization       $http_authorization;
        proxy_set_header            X-Portal-JWT        $http_x_portal_jwt;
        
        # --- Long-lived HTTP Stream Settings (same as oauth2_proxy path) ---
        proxy_http_version          1.1;
        proxy_buffering             on;
        proxy_read_timeout          86400s;
        proxy_send_timeout          86400s;
        proxy_request_buffering     off;
        proxy_cache                 off;
        proxy_max_temp_file_size    0;
        proxy_intercept_errors      off;
        proxy_set_header            Upgrade             "";
        proxy_set_header            Connection          "";
    }
    
    # =============================================================================
    # MCP MAIN ENDPOINT (Smart Router)
    # =============================================================================
    
    location = /_SRV/MCP/mcp {
        # Return success for non-POST (health/teardown probes)
        if ($request_method !~ ^(POST)$) {
            return                  204;
        }
        
        # --- ROUTING LOGIC ---
        # If Portal JWT detected, use Portal Backend path
        if ($is_portal_jwt = 1) {
            error_page              418 = @mcp_portal_jwt;
            return                  418;
        }
        
        # --- OAuth2 Proxy Authentication (Default Path) ---
        auth_request                /auth;
        error_page                  401 = @oauth2_redirect;
        auth_request_set            $user_email $upstream_http_x_auth_request_email;
        auth_request_set            $access_token $upstream_http_x_auth_request_access_token;

        # --- Proxy Headers for Upstream ---
        proxy_set_header            Host                $host;
        proxy_set_header            X-Real-IP           $remote_addr;
        proxy_set_header            X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header            X-Forwarded-Proto   $scheme;
        proxy_set_header            X-Forwarded-User    $user_email;
        proxy_set_header            Authorization       "Bearer $access_token";

        # --- Long-lived HTTP Stream Settings ---
        proxy_http_version          1.1;
        proxy_buffering             on;
        proxy_read_timeout          86400s;
        proxy_send_timeout          86400s;
        proxy_request_buffering     off;
        proxy_cache                 off;
        proxy_max_temp_file_size    0;
        proxy_intercept_errors      off;
        proxy_set_header            Upgrade             "";
        proxy_set_header            Connection          "";

        # Pass to upstream with trailing slash
        proxy_pass                  http://envoy/_SRV/MCP/mcp/;
    }
    
    # ... rest of config ...
}
```

---

## 🔄 REQUEST FLOWS

### **Flow 1: OAuth2 Proxy (Interactive - CTERA AI)**

```
Claude Desktop / Browser
    ↓
    Request: POST /_SRV/MCP/mcp
    Headers: Cookie: _oauth2_proxy=...
    ↓
nginx checks: $is_portal_jwt = 0 (no X-Portal-JWT header)
    ↓
nginx calls: auth_request /auth
    ↓
oauth2_proxy validates: Cookie against IdP
    ↓
oauth2_proxy returns: X-Auth-Request-Email, X-Auth-Request-Access-Token
    ↓
nginx forwards to envoy: Authorization: Bearer <IdP_token>, X-Forwarded-User: user@company.com
    ↓
envoy → MCP Python Service
```

**Unchanged!** Existing CTERA AI flow continues to work.

---

### **Flow 2: Portal JWT (Non-Interactive - n8n Automation)**

```
n8n Workflow
    ↓
    Request: POST /_SRV/MCP/mcp
    Headers: 
      Authorization: Bearer eyJhbGci...  (Portal JWT)
      X-Portal-JWT: eyJhbGci...          (Same token, signals Portal-issued)
    ↓
nginx checks: $is_portal_jwt = 1 (X-Portal-JWT present)
    ↓
nginx routes to: @mcp_portal_jwt (internal location)
    ↓
nginx forwards to: http://tomcat/_SRV/MCP/mcp
    ↓
Portal Backend (Java):
  1. AuthenticationBearerAuthenticator extracts: Authorization header
  2. JwtAuthorizationBearerValidator validates: JWT signature, expiration, claims
  3. Returns UserPrincipal: user UID, tenant, scopes
  4. McpHandler forwards to: http://envoy/_SRV/MCP/mcp with UserPrincipal context
    ↓
envoy → MCP Python Service (receives authenticated request)
```

**New path!** Automation tools can now use Portal JWTs.

---

## 🏗️ PORTAL BACKEND CHANGES NEEDED

### **1. Add MCP Proxy Endpoint**

**New file**: `Common/src/main/java/com/ctera/web/microservices/McpProxyHandler.java`

```java
package com.ctera.web.microservices;

import com.ctera.jaas.UserPrincipal;
import com.ctera.logging.CteraLogger;
import com.ctera.microservices.services.request.ServiceRequest;
import com.ctera.microservices.services.request.ServiceRequestBuilder;
import com.ctera.infra.protocol.enums.CTTPMethodID;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class McpProxyHandler {
    private static final CteraLogger logger = CteraLogger.getLogger(McpProxyHandler.class);
    private static final String ENVOY_HOST = "127.0.0.1";
    private static final int ENVOY_PORT = 80;
    
    public void proxyToMcp(HttpServletRequest req, HttpServletResponse resp) {
        UserPrincipal userPrincipal = (UserPrincipal) req.getUserPrincipal();
        if (userPrincipal == null) {
            resp.setStatus(401);
            return;
        }
        
        // Forward to Envoy with user context
        ServiceRequestBuilder builder = new ServiceRequestBuilder(
            CTTPMethodID.Post,
            "/_SRV/MCP/mcp",
            readRequestBody(req),
            "http",
            ENVOY_HOST,
            ENVOY_PORT
        );
        
        // Add user identity headers (like oauth2_proxy does)
        builder.addHeader("X-Forwarded-User", userPrincipal.getName());
        builder.addHeader("X-Portal-User-UID", String.valueOf(userPrincipal.getUserUid()));
        
        ServiceRequest request = builder.build();
        ServiceResponse response = request.execute();
        
        // Forward response back to client
        writeResponse(resp, response);
    }
}
```

### **2. Add URL Mapping**

**Update**: `ServicesPortal/src/main/webapp/WEB-INF/web.xml` or Spring configuration

```xml
<servlet-mapping>
    <servlet-name>PortalServlet</servlet-name>
    <url-pattern>/_SRV/MCP/mcp</url-pattern>
</servlet-mapping>
```

### **3. JwtAuthorizationBearerValidator Already Plugged In**

The existing bearer authentication valve will automatically:
1. Extract `Authorization: Bearer <token>` header
2. Try validators in chain (Nomad, OAuth2, ApiKey, **JWT** ← new)
3. `JwtAuthorizationBearerValidator` validates Portal JWT
4. Returns `UserPrincipal` if valid
5. Request continues with authenticated user

---

## 🧪 TESTING

### **Test 1: OAuth2 Proxy Path (Should Still Work)**

```bash
# Interactive login via browser, get cookie
curl -X POST https://portal.company.com/_SRV/MCP/mcp \
  -H "Cookie: _oauth2_proxy=<cookie_value>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

**Expected**: Works as before, no changes.

---

### **Test 2: Portal JWT Path (New)**

```bash
# Get Portal JWT
PORTAL_JWT=$(curl -k -X POST "https://portal.company.com/api/auth/tokens/generate" \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"audience":"mcp","lifetime_days":90}' | jq -r '.token')

# Use Portal JWT
curl -X POST https://portal.company.com/_SRV/MCP/mcp \
  -H "Authorization: Bearer $PORTAL_JWT" \
  -H "X-Portal-JWT: $PORTAL_JWT" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

**Expected**: Portal Backend validates JWT, forwards to MCP, returns result.

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] Update nginx config (`/etc/nginx/ctera.conf`)
  - [ ] Add `$is_portal_jwt` map
  - [ ] Add `@mcp_portal_jwt` location
  - [ ] Update `/_SRV/MCP/mcp` location with routing logic
- [ ] Reload nginx: `sudo systemctl reload ctera-nginx`
- [ ] Deploy Portal Backend with JWT validator
  - [ ] `JwtAuthorizationBearerValidator.java`
  - [ ] `McpProxyHandler.java`
  - [ ] Add to bearer auth chain
- [ ] Test both paths (oauth2_proxy + Portal JWT)
- [ ] Update n8n node to send `X-Portal-JWT` header
- [ ] Monitor logs for any issues

---

## 🔒 SECURITY CONSIDERATIONS

### **1. JWT Validation Must Be Secure**
- ✅ Signature validation (HMAC-SHA256)
- ✅ Expiration checking
- ✅ Issuer validation (`iss` = "ctera-portal")
- ✅ Audience validation (`aud` = "mcp")
- ✅ Revocation checking (optional Phase 2)

### **2. No Bypass of OAuth2 Proxy for Interactive**
- ✅ Portal JWT path requires explicit `X-Portal-JWT` header
- ✅ Interactive users won't accidentally use Portal JWT path
- ✅ Two independent authentication mechanisms

### **3. Rate Limiting** (Optional)
```nginx
limit_req_zone $binary_remote_addr zone=mcp_portal:10m rate=100r/s;

location @mcp_portal_jwt {
    limit_req zone=mcp_portal burst=200;
    # ... rest of config
}
```

---

## 🎉 RESULT

**Two authentication paths, one endpoint**:

| Path | Auth Method | Use Case | Flow |
|------|-------------|----------|------|
| **OAuth2 Proxy** | IdP JWT + Cookie | Interactive AI | nginx → oauth2-proxy → envoy → MCP |
| **Portal JWT** | Portal JWT | Automation (n8n) | nginx → Portal Backend → envoy → MCP |

**Both paths converge at MCP Python Service** with authenticated user context!


