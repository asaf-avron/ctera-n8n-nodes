# ⚡ CTERA n8n Node - Quick Start (5 Minutes)

## 1️⃣ Get Token

```bash
cd c:\dev\ctera-n8n-nodes\scripts
./get-portal-token.sh a1 "password1!"
```

**Copy the token!** You'll need it in step 4.

---

## 2️⃣ Build Node

```bash
cd c:\dev\ctera-n8n-nodes
npm install
npm run build
```

---

## 3️⃣ Start n8n with Local Node

```bash
# Git Bash (recommended)
N8N_CUSTOM_EXTENSIONS=/c/dev/ctera-n8n-nodes npx n8n
```

```powershell
# PowerShell alternative
$env:N8N_CUSTOM_EXTENSIONS="C:\dev\ctera-n8n-nodes"
npx n8n
```

Open: **http://localhost:5678**

> **Important**: The `N8N_CUSTOM_EXTENSIONS` environment variable tells n8n where to find your local custom nodes. This is required before importing workflows that use custom nodes.

---

## 5️⃣ Configure in n8n UI

1. **Credentials** → **Add Credential**
2. Search **"CTERA Filesystem API"**
3. Fill in:
   - **MCP Server URL**: `http://localhost:81`
   - **Bearer Token**: Paste token from step 1
   - **Ignore SSL**: ✓ Check
4. **Save**

---

## 6️⃣ Create Test Workflow

1. **Workflows** → **Add Workflow**
2. Add **"Manual Trigger"** node
3. Add **"CTERA Filesystem"** node
4. Configure:
   - **Resource**: Directory
   - **Operation**: List
   - **Path**: `/`
   - **Credential**: Select your credential
5. Click **"Execute Workflow"**

**Success!** You should see files listed.

---

## 🔄 Development Mode

```bash
# Terminal 1: Auto-rebuild
cd c:\dev\ctera-n8n-nodes
npm run dev

# Terminal 2: Run n8n with local node
N8N_CUSTOM_EXTENSIONS=/c/dev/ctera-n8n-nodes npx n8n
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Node not showing | `npm run build`, then restart n8n with `N8N_CUSTOM_EXTENSIONS` |
| "Unrecognized node type" | Restart n8n with `N8N_CUSTOM_EXTENSIONS` set **before** importing workflow |
| "Package version does not exist" | This means n8n is trying npm instead of local. Set `N8N_CUSTOM_EXTENSIONS` |
| 401 Error | Get fresh token, update credential |
| Connection refused | Check MCP running: `curl http://localhost:81/health` |

---

## 📖 Full Guides

- **Detailed Setup**: `docs/QUICK_LOCAL_N8N_SETUP.md`
- **Full Testing Guide**: `docs/LOCAL_TESTING_GUIDE.md`
- **Node Specification**: `docs/designs/n8n-filesystem-node/n8n-ctera-filesystem-node-spec.md`

---

**Architecture**:
```
┌─────────────┐    JWT Token    ┌──────────────┐
│    n8n UI   │ ──────────────> │  Portal MCP  │
│ localhost:  │                 │ localhost:81 │
│    5678     │ <────────────── │ (or remote)  │
└─────────────┘   File Data     └──────────────┘
      ↑
      │ Uses (via N8N_CUSTOM_EXTENSIONS)
      ↓
┌─────────────────────────────┐
│  CTERA Filesystem Node      │
│  @ctera/n8n-nodes-ctera     │
│  C:\dev\ctera-n8n-nodes     │
└─────────────────────────────┘
```

🎉 **You're ready to build workflows!**
