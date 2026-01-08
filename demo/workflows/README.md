# 📂 n8n Workflow Examples

This directory contains ready-to-use n8n workflows demonstrating the CTERA Filesystem node.

---

## 🎬 Demo Workflow: OAuth2 File Operations

**File**: `demo-oauth2-workflow.json`

### **What It Does:**

This workflow demonstrates all major CTERA Filesystem operations:

1. **List Root Directory** - Shows all top-level folders
2. **Read Demo File** - Reads content from an existing file
3. **Write New File** - Creates a timestamped file with dynamic content
4. **Create Public Link** - Generates a shareable download link (7-day expiry)
5. **Walk Directory Tree** - Recursively lists all files in a directory
6. **Copy to Marketing** - Duplicates the file to another folder

### **How to Import:**

#### **Step 1: Open n8n**
```bash
npx n8n
```
Navigate to: http://localhost:5678

#### **Step 2: Import Workflow**
1. Click **"Workflows"** tab
2. Click **"+"** dropdown → **"Import from File"**
3. Select: `workflows/demo-oauth2-workflow.json`
4. Workflow opens automatically

#### **Step 3: Configure Credential**
1. Click on any **CTERA Filesystem** node
2. In the **"Credential to connect with"** dropdown, select your OAuth2 credential
3. If you haven't created one yet:
   - Click **"+ Create New"**
   - Fill in Portal URL, Client ID, Client Secret
   - Click **"Connect my account"** → Complete OAuth2 flow

#### **Step 4: Execute**
- **Single Node**: Click **"Execute step"** on any node
- **Entire Workflow**: Click **"Execute workflow"** (top-right)
- **Manual Trigger**: Click **"Execute Workflow"** button

---

## 🎯 Use Cases Demonstrated

### **1. Scheduled Data Processing**
The workflow is triggered every hour automatically, perfect for:
- Regular report generation
- Periodic backups
- Scheduled file synchronization

### **2. Dynamic File Naming**
Uses n8n expressions for timestamps:
```
/My Files/n8n-demo-{{$now.toFormat('yyyy-MM-dd-HH-mm-ss')}}.txt
```

### **3. Fan-Out Pattern**
After listing root directory, workflow branches to:
- Read existing files
- Write new files
- Walk subdirectories

### **4. Automated Sharing**
Creates public download links programmatically with expiration.

### **5. File Organization**
Copies files between folders for backup/archival.

---

## 🔧 Customization Ideas

### **Change the Schedule**
Edit the **"Every Hour"** trigger:
- Daily at 9am: `0 9 * * *` (cron)
- Every 15 minutes: `*/15 * * * *`
- Monday mornings: `0 9 * * 1`

### **Modify File Content**
Edit the **"Write New File"** node to include:
- Data from previous nodes: `{{$json.data}}`
- Environment variables: `{{$env.MY_VAR}}`
- Complex expressions: `{{$now.plus({days: 7}).toISO()}}`

### **Add Notifications**
After **"Create Public Link"**, add:
- **Slack** node → Send link to channel
- **Email** node → Email link to recipients
- **HTTP Request** → POST link to webhook

### **Add Error Handling**
Wrap operations in **IF** nodes:
- Check if file exists before reading
- Verify link creation succeeded
- Handle errors gracefully

---

## 📊 Expected Output

### **Node 1: List Root Directory**
```json
[
  {"name": "My Files", "is_dir": true, "deleted": false},
  {"name": "Demo-Materials", "is_dir": true, "deleted": false},
  {"name": "Marketing", "is_dir": true, "deleted": false}
]
```

### **Node 2: Read Demo File**
```json
{
  "content": "# CTERA Demo Materials\n\nWelcome...",
  "path": "/Demo-Materials/README.md"
}
```

### **Node 3: Write New File**
```json
{
  "result": "File written successfully",
  "path": "/My Files/n8n-demo-2026-01-07-12-30-45.txt"
}
```

### **Node 4: Create Public Link**
```json
{
  "url": "https://udi.ctera.me/public/abc123...",
  "expires_at": "2026-01-14T12:30:45Z",
  "access": "download"
}
```

### **Node 5: Walk Directory Tree**
```json
[
  {"name": "README.md", "path": "/Demo-Materials/README.md", "is_dir": false},
  {"name": "images", "path": "/Demo-Materials/images", "is_dir": true},
  {"name": "logo.png", "path": "/Demo-Materials/images/logo.png", "is_dir": false}
]
```

### **Node 6: Copy to Marketing**
```json
{
  "result": "File copied successfully",
  "source": "/My Files/n8n-demo-2026-01-07-12-30-45.txt",
  "destination": "/Marketing/backup-2026-01-07.txt"
}
```

---

## 🆘 Troubleshooting

### **"Credential not found" Error**
**Fix**: Each node needs a credential assigned
1. Click the node
2. Select your OAuth2 credential from dropdown
3. All nodes can share the same credential

### **"Directory not found" Error**
**Fix**: Adjust paths to match your Portal structure
- Use `/` to see available directories
- Update paths in nodes to match your folders

### **"Empty array" Output**
**Fix**: Python-to-JSON conversion issue (should be fixed in latest version)
- Ensure you're using latest build: `npm run build`
- Check terminal logs for `🔍` debug output

### **OAuth2 Token Expired**
**Fix**: Reconnect credential
1. Go to **Credentials** tab
2. Find your CTERA credential
3. Click **"Connect my account"** again
4. Complete OAuth2 flow

---

## 📚 Additional Workflows (Coming Soon)

### **`backup-workflow.json`** (Planned)
Automated incremental backups with version tracking

### **`compliance-workflow.json`** (Planned)
Data retention policy enforcement

### **`webhook-ingestion.json`** (Planned)
External data ingestion via HTTP webhook

---

## 🚀 Creating Your Own Workflows

### **Best Practices:**

1. **Start Simple**: Begin with 2-3 nodes, test, then expand
2. **Use Expressions**: Leverage `{{$json}}`, `{{$now}}`, `{{$workflow}}`
3. **Handle Errors**: Add error outputs and fallback logic
4. **Test Incrementally**: Execute nodes one at a time
5. **Name Clearly**: Give nodes descriptive names like "1. List Root"
6. **Comment Liberally**: Use sticky notes to document logic

### **Common Patterns:**

**Pattern 1: List → Filter → Process**
```
List Directory → IF (filter) → Write File
```

**Pattern 2: Schedule → Transform → Upload**
```
Schedule → HTTP Request (API) → Transform (Code) → Write to CTERA
```

**Pattern 3: Webhook → Process → Notify**
```
Webhook → Write to CTERA → Create Link → Slack Notification
```

---

## 📖 Documentation Links

- **n8n Expressions**: https://docs.n8n.io/code-examples/expressions/
- **Workflow Examples**: https://docs.n8n.io/workflows/examples/
- **CTERA Node Docs**: `../README.md`
- **OAuth2 Setup**: `../docs/OAUTH2_QUICK_START.md`

---

**Happy Automating! 🎉**
