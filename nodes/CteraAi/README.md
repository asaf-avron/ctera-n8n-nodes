# CTERA Data Intelligence Node

n8n node for interacting with CTERA AI experts via MCP (Model Context Protocol) endpoints.

## Overview

This node enables semantic search, file discovery, and conversational AI over CTERA-managed knowledge bases (experts).

## Authentication

Configure the **CTERA AI MCP API** credential with:

- **MCP Server URL**: Base URL of your CTERA MCP server
- **Bearer Token**: API token for authentication
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
- **Query**: Search expression with free-text and `key:value` filters
- **Limit**: Max results (1-250)
- **Offset**: Pagination offset
- **Sort By**: `relevance`, `modified_at`, `created_at`, `name`
- **Include Snippet**: Return text snippet per file
- **Include Markdown**: Return full markdown body

**Output Fields:**
- `fileId`, `name`, `path`, `sizeBytes`, `mimeType`
- `createdAt`, `modifiedAt`, `storageSystem`, `bucketOrShare`
- `score`, `standardMetadata`, `customMetadata`
- `snippet`, `markdownBody` (when requested)

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
