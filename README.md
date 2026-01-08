# n8n-nodes-ctera

n8n community nodes for CTERA integration - filesystem operations and AI-powered data intelligence.

## Installation

```bash
cd ~/.n8n/nodes
npm install @ctera/n8n-nodes-ctera
```

Restart n8n after installation.

## Nodes

### CTERA Filesystem

Perform storage operations on CTERA Portal via MCP:
- **File**: Read, write, copy, move, rename, delete
- **Directory**: List, create, delete, walk, recover
- **Links**: Public sharing links and permalinks
- **Versions**: File version history

Supports OAuth2 (Entra ID) or JWT bearer token authentication.

**[Detailed Documentation →](nodes/CteraFilesystem/README.md)**

### CTERA Data Intelligence

Interact with CTERA AI experts for semantic search and knowledge retrieval:
- **List Experts**: Discover available knowledge bases
- **Semantic Search**: Retrieve text chunks for RAG workflows
- **File Search**: Search files with metadata filters
- **Chat**: Get AI-generated answers

**[Detailed Documentation →](nodes/CteraAi/README.md)**

## Credentials

| Credential | Used By | Description |
|------------|---------|-------------|
| CTERA Portal OAuth2 API | Filesystem | Entra ID SSO authentication |
| CTERA Filesystem API | Filesystem | JWT bearer token authentication |
| CTERA AI MCP API | Data Intelligence | MCP bearer token authentication |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Link for local development
npm link
cd ~/.n8n/nodes && npm link @ctera/n8n-nodes-ctera
```

## License

[MIT](LICENSE)
