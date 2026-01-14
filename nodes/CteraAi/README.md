# CTERA Data Intelligence Node

n8n node for interacting with CTERA AI experts via MCP (Model Context Protocol) endpoints.

## Overview

This node enables semantic search, file discovery, and conversational AI over CTERA-managed knowledge bases (experts).

## Credentials

### Generating an MCP Bearer Token

**1. Log into Admin UI** with your SSO credentials

**2. Generate MCP Bearer Token:**

Navigate to the MCP Tokens section in Admin UI, or use the API:

```bash
curl -k -X POST "https://YOUR_ADMIN_URL/admin/api/mcp-tokens/generate" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}' | jq -r .token
```

**3. Configure in n8n:**

- **MCP Server URL**: `https://mcp.your-domain.com`
- **Bearer Token**: Paste the token from step 2
- **Ignore SSL Issues**: Enable for self-signed certificates

## Operations

### List Experts

Discover available AI experts (knowledge bases) in your environment. Returns expert IDs and their MCP endpoint URLs.

### Semantic Search (for RAG)

Retrieve raw text chunks for Retrieval-Augmented Generation workflows.

**Parameters:**
- **Expert MCP Endpoint URL**: Per-expert endpoint (from List Experts)
- **Query**: Natural language search query
- **Number of Results (k)**: Top-k chunks to return (1-50)
- **Window Size**: Context window in KB (1-10)
- **Modified Date Start/End**: Filter by modification date

### File Search

Search files and return metadata with optional content snippets.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Query | string | required | Search expression with free-text and optional `key:value` filters |
| Limit | number | 100 | Maximum number of results (max: 250) |
| Offset | number | 0 | Pagination offset |
| Sort By | select | relevance | Sort order: `relevance`, `modified_at`, `created_at`, `name` |
| Include Snippet | boolean | false | Include text snippet per file |
| Include Markdown | boolean | false | Include full markdown body per file |

**Output Fields:**

| Field | Type | Description |
|-------|------|-------------|
| fileId | string | Document UUID |
| name | string | File name |
| path | string | File path |
| sizeBytes | number | File size in bytes |
| mimeType | string | MIME content type |
| createdAt | string | ISO timestamp of creation |
| modifiedAt | string | ISO timestamp of last modification |
| storageSystem | string | Storage system identifier |
| bucketOrShare | string | Bucket or share name |
| score | number | Relevance score (0-1) |
| standardMetadata | object | Standard file metadata (guid, dataset_id, permissions) |
| customMetadata | object | Custom metadata (classifier_tags, classifications) |
| snippet | string | Text snippet (when include_snippet=true) |
| markdownBody | string | Full markdown content (when include_markdown=true) |
| _meta | object | Pagination info (total, limit, offset) |

### Chat

Get a direct, generated answer from an AI expert.

**Parameters:**
- **Expert MCP Endpoint URL**: Per-expert endpoint
- **Query**: Your question or prompt

## Search Query Syntax

File Search supports combined free-text and metadata filters:

```
# Free-text search
API documentation

# With classifier filters
security policy department:Legal urgency:high

# Combined
project update department:Engineering status:approved
```

## Example Use Cases

- **Daily Intelligence Reports**: Schedule semantic searches for updates
- **Q&A Chatbots**: Build webhook chatbots using Chat operation
- **Document Discovery**: Monitor for new content matching criteria
- **Compliance Scanning**: Search for files by classifier tags
- **RAG Pipelines**: Feed semantic search results to LLMs
- **File Metadata Analysis**: Use File Search to find files by metadata filters

## Resources

- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [GitHub Issues](https://github.com/ctera/ctera-n8n-nodes/issues)
