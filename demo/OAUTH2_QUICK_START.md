# ⚡ OAuth2 Quick Start - Like Claude Desktop

**Works just like Claude!** Only need 4 fields:
- Portal URL
- Tenant ID
- Client ID
- Client Secret

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
3. Fill in **only 4 fields**:

| Field | Value |
|-------|-------|
| **Portal URL** | `https://udi.ctera.me` |
| **Tenant ID** | `bc628184-c9ef-43d6-b578-c5da746783ab` |
| **Client ID** | `524e4423-a684-4c70-82f2-33b0168e8e87` |
| **Client Secret** | Your secret value from Azure Portal |

4. Click **Connect my account** → Sign in with Microsoft
5. Done! ✅

**Note**: Authorization URL and Token URL are automatically configured based on your Tenant ID.

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
= 4 fields - same as Claude!
```

**Everything else is automatic!**

---

## 🔑 How It Works

The credential automatically constructs:
- **Authorization URL**: `https://login.microsoftonline.com/{your-tenant-id}/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/{your-tenant-id}/oauth2/v2.0/token`
- **Scopes**: `User.Read offline_access openid profile`
- **MCP Endpoint**: `{your-portal-url}/_SRV/MCP/mcp`

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
