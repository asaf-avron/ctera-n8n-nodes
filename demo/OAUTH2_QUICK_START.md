# ⚡ OAuth2 Quick Start - Like Claude Desktop

**Simple OAuth2 setup!** Just need:
- Portal URL
- Tenant ID  
- Client ID & Secret
- Scope (your API permissions)

---

## 🚀 Setup (3 Steps)

### 1️⃣ Add n8n Callback to Azure Portal

1. Go to **Azure Portal** → **App registrations** → `oauth2-proxy-app`
2. Click **Authentication**
3. Click **Add URI** under Web platform
4. Add: `http://localhost:5678/rest/oauth2-credential/callback`
5. Click **Save**

---

### 2️⃣ Build & Start

```bash
cd c:\dev\ctera-n8n-nodes
npm install && npm run build

# Start n8n with local custom node
N8N_CUSTOM_EXTENSIONS=/c/dev/ctera-n8n-nodes npx n8n
```

> **Windows PowerShell alternative:**
> ```powershell
> $env:N8N_CUSTOM_EXTENSIONS="C:\dev\ctera-n8n-nodes"
> npx n8n
> ```

Open: **http://localhost:5678**

---

### 3️⃣ Configure Credential in n8n

1. **Credentials** → **Add Credential**
2. Search for **"CTERA Portal OAuth2 API"**
3. Fill in the fields:

| Field | Value |
|-------|-------|
| **Portal URL** | Your CTERA Portal URL (e.g., `https://your-portal.ctera.com`) |
| **Tenant ID** | Your Azure AD Tenant ID |
| **Client ID** | Your App Registration Client ID |
| **Client Secret** | Your App Registration Client Secret |
| **Scope** | `api://YOUR-CLIENT-ID/access openid profile offline_access` |

4. Click **Connect my account** → Sign in with Microsoft
5. Done! ✅

**Note**: Authorization URL and Token URL are automatically constructed from your Tenant ID.

---

## 🎯 Use with CTERA Filesystem Node

1. Create workflow
2. Add **CTERA Filesystem** node
3. Select **"CTERA Portal OAuth2 API"** credential
4. Configure operation (List, Read, Write, etc.)
5. Execute!

---

## 🆚 Comparison

### Before (Generic OAuth2 API) ❌
```
Need to configure:
✗ Portal URL
✗ Authorization URL (long URL)
✗ Access Token URL (long URL)
✗ Client ID
✗ Client Secret
✗ Scope
✗ Authentication method
= 7 fields!
```

### Now (CTERA Portal OAuth2 API) ✅
```
Only need:
✓ Portal URL
✓ Tenant ID
✓ Client ID  
✓ Client Secret
✓ Scope
= 5 fields, URLs auto-generated!
```

**Authorization and Token URLs are constructed automatically from your Tenant ID!**

---

## 🔑 How It Works

The credential automatically constructs URLs from your Tenant ID:
- **Authorization URL**: `https://login.microsoftonline.com/{your-tenant-id}/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/{your-tenant-id}/oauth2/v2.0/token`

You configure:
- **Scope**: Your API permissions (e.g., `api://client-id/access openid profile offline_access`)
- **MCP Endpoint**: Automatically uses `{your-portal-url}/_SRV/MCP/mcp`

---

## ✅ Benefits

- ✨ **Simple**: Just like Claude Desktop - only 4 fields
- 🔄 **Auto-refresh**: Tokens refresh automatically
- 🔒 **Secure**: OAuth2 Authorization Code flow
- 🎯 **Integrated**: Works directly with CTERA Filesystem node

---

## 📝 Full Example Workflow

```
[Manual Trigger]
    ↓
[CTERA Filesystem]
  Resource: Directory
  Operation: List
  Path: /
  Credential: CTERA Portal OAuth2 API ← Your OAuth2 credential
    ↓
[Process Results]
```

---

## 🐛 Troubleshooting

**Node doesn't show OAuth2 credential option?**
```bash
# Rebuild
cd c:\dev\ctera-n8n-nodes
npm run build
# Restart n8n
```

**"Cannot find credential type"?**
- Make sure you're using **"CTERA Portal OAuth2 API"** (new)
- Not "Generic OAuth2 API" (old)
- Check package.json includes the new credential

**Redirect URI mismatch?**
- Verify in Azure Portal: `http://localhost:5678/rest/oauth2-credential/callback`
- Exact match required (including `http://` and `/callback`)

---

🎉 **You're ready!** Same simplicity as Claude, but in n8n workflows.
