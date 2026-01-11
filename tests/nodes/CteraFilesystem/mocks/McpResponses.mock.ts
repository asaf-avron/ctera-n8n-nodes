/**
 * Mock MCP/JSON-RPC responses for testing
 * These simulate the responses from the CTERA MCP service
 */

// ============================================================================
// Directory Operations
// ============================================================================

export const mockListDirectoryResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify([
					{ name: 'Documents', type: 'directory', size: 0, modified: '2024-01-15T10:30:00Z' },
					{ name: 'Photos', type: 'directory', size: 0, modified: '2024-01-14T08:00:00Z' },
					{ name: 'readme.txt', type: 'file', size: 1024, modified: '2024-01-10T12:00:00Z' },
				]),
			},
		],
	},
	id: 1,
};

export const mockEmptyDirectoryResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify([]),
			},
		],
	},
	id: 1,
};

export const mockCreateDirectoryResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ success: true, path: '/test-folder' }),
			},
		],
	},
	id: 1,
};

export const mockWalkDirectoryResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({
					path: '/root',
					dirs: ['subdir1', 'subdir2'],
					files: ['file1.txt', 'file2.txt'],
				}),
			},
		],
	},
	id: 1,
};

// ============================================================================
// File Operations
// ============================================================================

export const mockReadFileResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: 'Hello, this is the file content!',
			},
		],
	},
	id: 1,
};

export const mockWriteFileResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ success: true, path: '/uploaded-file.txt', size: 256 }),
			},
		],
	},
	id: 1,
};

export const mockDeleteResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ success: true, deleted: ['/file-to-delete.txt'] }),
			},
		],
	},
	id: 1,
};

export const mockCopyResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ success: true, source: '/source.txt', destination: '/dest.txt' }),
			},
		],
	},
	id: 1,
};

export const mockMoveResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ success: true, source: '/old-path.txt', destination: '/new-path.txt' }),
			},
		],
	},
	id: 1,
};

export const mockRenameResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ success: true, oldName: 'old-name.txt', newName: 'new-name.txt' }),
			},
		],
	},
	id: 1,
};

// ============================================================================
// Version Operations
// ============================================================================

export const mockListVersionsResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify([
					{ version: 1, date: '2024-01-10T12:00:00Z', size: 1024 },
					{ version: 2, date: '2024-01-12T14:30:00Z', size: 1536 },
					{ version: 3, date: '2024-01-15T09:00:00Z', size: 2048 },
				]),
			},
		],
	},
	id: 1,
};

// ============================================================================
// Link Operations
// ============================================================================

export const mockCreatePublicLinkResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({
					url: 'https://portal.ctera.com/public/share/abc123',
					accessKey: 'abc123',
					expires: '2024-02-15T00:00:00Z',
				}),
			},
		],
	},
	id: 1,
};

export const mockGetPermalinkResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: 'https://portal.ctera.com/permalink/xyz789',
			},
		],
	},
	id: 1,
};

// ============================================================================
// Error Responses
// ============================================================================

export const mockErrorNotFound = {
	jsonrpc: '2.0',
	error: {
		code: -32001,
		message: 'Path not found: /nonexistent/path',
	},
	id: 1,
};

export const mockErrorPermissionDenied = {
	jsonrpc: '2.0',
	error: {
		code: -32002,
		message: 'Permission denied: insufficient access rights',
	},
	id: 1,
};

export const mockErrorInvalidRequest = {
	jsonrpc: '2.0',
	error: {
		code: -32600,
		message: 'Invalid Request',
	},
	id: 1,
};

export const mockErrorMethodNotFound = {
	jsonrpc: '2.0',
	error: {
		code: -32601,
		message: 'Method not found',
	},
	id: 1,
};

export const mockErrorInternalError = {
	jsonrpc: '2.0',
	error: {
		code: -32603,
		message: 'Internal error',
	},
	id: 1,
};

// ============================================================================
// Recovery Operations
// ============================================================================

export const mockRecoverResponse = {
	jsonrpc: '2.0',
	result: {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ success: true, recovered: ['/recovered-file.txt'] }),
			},
		],
	},
	id: 1,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a custom success response with arbitrary data
 */
export function createSuccessResponse(data: unknown, id = 1) {
	return {
		jsonrpc: '2.0',
		result: {
			content: [
				{
					type: 'text',
					text: typeof data === 'string' ? data : JSON.stringify(data),
				},
			],
		},
		id,
	};
}

/**
 * Create a custom error response
 */
export function createErrorResponse(code: number, message: string, id = 1) {
	return {
		jsonrpc: '2.0',
		error: { code, message },
		id,
	};
}

