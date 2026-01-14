# CTERA Filesystem Node

n8n node for performing filesystem operations on CTERA Portal storage via MCP (Model Context Protocol).

## Overview

This node enables workflow automation for CTERA storage operations including file management, directory operations, versioning, and link sharing.

## Authentication

Uses Entra ID (Azure AD) OAuth2 for SSO authentication. Configure in n8n with:

- **Portal URL**: Your CTERA Portal base URL (e.g., `https://portal.ctera.me`)
- **Authorization URL**: Entra ID OAuth2 authorize endpoint
- **Access Token URL**: Entra ID OAuth2 token endpoint  
- **Client ID / Secret**: From your Entra ID app registration
- **API Scope**: Your Azure AD API scope (e.g., `api://client-id/access`)
- **Ignore SSL Issues**: Enable for self-signed certificates

## Resources & Operations

### File Operations

| Operation | Description |
|-----------|-------------|
| Read | Read text file contents |
| Write | Write content to a file |
| Copy | Copy file to new location |
| Move | Move file to new location |
| Rename | Rename a file |
| Delete | Delete one or more files |

### Directory Operations

| Operation | Description |
|-----------|-------------|
| List | List directory contents |
| Create | Create new directory (with optional parent creation) |
| Delete | Delete directories |
| Walk | Recursively traverse directory tree |
| Recover | Recover deleted items |

### Link Operations

| Operation | Description |
|-----------|-------------|
| Create Public Link | Generate shareable link with RO/RW access and expiration |
| Get Permalink | Get permanent link to file or directory |

### Version Operations

| Operation | Description |
|-----------|-------------|
| List | List all versions of a file |

## Parameters

### Common Parameters

- **Path**: Full path to file/directory (e.g., `/CloudFolders/shared/doc.txt`)
- **Paths**: Comma-separated paths for bulk operations (delete, recover)

### File-Specific

- **Content**: Text content for write operations
- **Destination**: Target path for copy/move
- **New Name**: New filename for rename

### Directory-Specific

- **Create Parent Directories**: Auto-create missing parents
- **Include Deleted**: Show deleted items in listings

### Link-Specific

- **Access Level**: `RO` (read-only) or `RW` (read-write)
- **Expire In**: Days until link expiration (1-365)

## Output

Operations return JSON with resource type, operation, and result:

```json
{
  "resource": "file",
  "operation": "read",
  "result": "File content here..."
}
```

List operations fan out to individual items for easy iteration in workflows.

## Example Use Cases

- **Automated Backups**: Copy files to archive folders on schedule
- **File Processing Pipelines**: Read files, process content, write results
- **Share Generation**: Create time-limited public links for reports
- **Directory Monitoring**: Walk trees to find and process files
- **Version Tracking**: List file versions for audit/compliance
