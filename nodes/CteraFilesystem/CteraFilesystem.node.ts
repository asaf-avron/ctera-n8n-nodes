import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class CteraFilesystem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CTERA Filesystem',
		name: 'cteraFilesystem',
		icon: 'file:ctera.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Perform filesystem operations on CTERA Portal storage via MCP',
		defaults: {
			name: 'CTERA Filesystem',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'cteraFilesystemApi',
				required: false,
			},
			{
				name: 'cteraPortalOAuth2Api',
				required: false,
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Directory',
						value: 'directory',
						description: 'Operations on directories',
					},
					{
						name: 'File',
						value: 'file',
						description: 'Operations on files',
					},
					{
						name: 'Link',
						value: 'link',
						description: 'Public link and permalink operations',
					},
					{
						name: 'Version',
						value: 'version',
						description: 'File version operations',
					},
				],
				default: 'file',
			},

			// ==================== FILE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Copy',
						value: 'copy',
						description: 'Copy a file to a new location',
						action: 'Copy a file',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete one or more files',
						action: 'Delete files',
					},
					{
						name: 'Move',
						value: 'move',
						description: 'Move a file to a new location',
						action: 'Move a file',
					},
					{
						name: 'Read',
						value: 'read',
						description: 'Read file contents (text files)',
						action: 'Read a file',
					},
					{
						name: 'Rename',
						value: 'rename',
						description: 'Rename a file',
						action: 'Rename a file',
					},
					{
						name: 'Write',
						value: 'write',
						description: 'Write content to a file',
						action: 'Write a file',
					},
				],
				default: 'read',
			},

			// ==================== DIRECTORY OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['directory'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new directory',
						action: 'Create a directory',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete one or more directories',
						action: 'Delete directories',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List directory contents',
						action: 'List directory contents',
					},
					{
						name: 'Recover',
						value: 'recover',
						description: 'Recover deleted items',
						action: 'Recover deleted items',
					},
					{
						name: 'Walk',
						value: 'walk',
						description: 'Recursively walk directory tree',
						action: 'Walk directory tree',
					},
				],
				default: 'list',
			},

			// ==================== VERSION OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['version'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'List all versions of a file',
						action: 'List file versions',
					},
				],
				default: 'list',
			},

			// ==================== LINK OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['link'],
					},
				},
				options: [
					{
						name: 'Create Public Link',
						value: 'createPublicLink',
						description: 'Create a public sharing link',
						action: 'Create a public link',
					},
					{
						name: 'Get Permalink',
						value: 'getPermalink',
						description: 'Get permanent link to a file or directory',
						action: 'Get permalink',
					},
				],
				default: 'createPublicLink',
			},

			// ==================== COMMON PARAMETERS ====================
			// Path parameter (used by most operations)
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '',
				required: true,
				placeholder: '/CloudFolders/shared/documents',
				description: 'Path to the file or directory',
				displayOptions: {
					hide: {
						operation: ['delete', 'recover'],
					},
				},
			},

			// Paths parameter (for delete/recover operations)
			{
				displayName: 'Paths',
				name: 'paths',
				type: 'string',
				default: '',
				required: true,
				placeholder: '/CloudFolders/shared/file1.txt, /CloudFolders/shared/file2.txt',
				description: 'Comma-separated list of paths to delete or recover',
				displayOptions: {
					show: {
						operation: ['delete', 'recover'],
					},
				},
			},

			// ==================== FILE-SPECIFIC PARAMETERS ====================
			// Content for write operation
			{
				displayName: 'Content',
				name: 'content',
				type: 'string',
				default: '',
				required: true,
				typeOptions: {
					rows: 5,
				},
				placeholder: 'File content to write...',
				description: 'Content to write to the file (text or base64-encoded binary)',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['write'],
					},
				},
			},

			// Destination for copy/move operations
			{
				displayName: 'Destination',
				name: 'destination',
				type: 'string',
				default: '',
				required: true,
				placeholder: '/CloudFolders/archive/documents',
				description: 'Destination path for the copy or move operation',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['copy', 'move'],
					},
				},
			},

			// New name for rename operation
			{
				displayName: 'New Name',
				name: 'newName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'new-filename.txt',
				description: 'New name for the file (without path)',
				displayOptions: {
					show: {
						resource: ['file'],
						operation: ['rename'],
					},
				},
			},

			// ==================== DIRECTORY-SPECIFIC PARAMETERS ====================
			// Create parents option
			{
				displayName: 'Create Parent Directories',
				name: 'createParents',
				type: 'boolean',
				default: false,
				description: 'Whether to create parent directories if they do not exist',
				displayOptions: {
					show: {
						resource: ['directory'],
						operation: ['create'],
					},
				},
			},

			// Include deleted option for list/walk
			{
				displayName: 'Include Deleted',
				name: 'includeDeleted',
				type: 'boolean',
				default: false,
				description: 'Whether to include deleted files in the results',
				displayOptions: {
					show: {
						resource: ['directory'],
						operation: ['list', 'walk'],
					},
				},
			},

			// ==================== LINK-SPECIFIC PARAMETERS ====================
			// Access level for public link
			{
				displayName: 'Access Level',
				name: 'access',
				type: 'options',
				options: [
					{
						name: 'Read Only',
						value: 'RO',
						description: 'Recipients can only view/download',
					},
					{
						name: 'Read/Write',
						value: 'RW',
						description: 'Recipients can view, download, and modify',
					},
				],
				default: 'RO',
				description: 'Access level for the public link',
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['createPublicLink'],
					},
				},
			},

			// Expiration for public link
			{
				displayName: 'Expire In (Days)',
				name: 'expireIn',
				type: 'number',
				default: 30,
				typeOptions: {
					minValue: 1,
					maxValue: 365,
				},
				description: 'Number of days until the link expires',
				displayOptions: {
					show: {
						resource: ['link'],
						operation: ['createPublicLink'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Try to get OAuth2 credentials first, fall back to simple bearer token
		let bearerToken: string;
		let allowUnauthorizedCerts = false;
		let mcpServerUrl: string;

		try {
			// Try OAuth2 credential first
			const oauth2Credentials = await this.getCredentials('cteraPortalOAuth2Api');
			const oauthTokenData = oauth2Credentials.oauthTokenData as any;
			bearerToken = oauthTokenData?.access_token as string;
			mcpServerUrl = `${(oauth2Credentials.portalUrl as string).replace(/\/$/, '')}/_SRV/MCP`;
			allowUnauthorizedCerts = false; // OAuth2 should use proper SSL
		} catch {
			// Fall back to simple bearer token credential
			const simpleCredentials = await this.getCredentials('cteraFilesystemApi');
			bearerToken = simpleCredentials.bearerToken as string;
			allowUnauthorizedCerts = simpleCredentials.allowUnauthorizedCerts as boolean;
			mcpServerUrl = (simpleCredentials.serverUrl as string).replace(/\/$/, '');
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let toolName: string;
				const toolArgs: Record<string, unknown> = {};

				// Determine tool name and arguments based on resource and operation
				if (resource === 'file') {
					switch (operation) {
						case 'read':
							toolName = 'ctera_portal_read_file';
							toolArgs.path = this.getNodeParameter('path', i) as string;
							break;

						case 'write':
							toolName = 'ctera_portal_upload_from_content';
							toolArgs.filepath = this.getNodeParameter('path', i) as string;
							toolArgs.content = this.getNodeParameter('content', i) as string;
							break;

						case 'delete': {
							toolName = 'ctera_portal_delete_items';
							const deletePaths = (this.getNodeParameter('paths', i) as string)
								.split(',')
								.map((p) => p.trim())
								.filter((p) => p);
							toolArgs.paths = deletePaths;
							break;
						}

						case 'copy':
							toolName = 'ctera_portal_copy_item';
							toolArgs.source = this.getNodeParameter('path', i) as string;
							toolArgs.destination = this.getNodeParameter('destination', i) as string;
							break;

						case 'move':
							toolName = 'ctera_portal_move_item';
							toolArgs.source = this.getNodeParameter('path', i) as string;
							toolArgs.destination = this.getNodeParameter('destination', i) as string;
							break;

						case 'rename':
							toolName = 'ctera_portal_rename_item';
							toolArgs.path = this.getNodeParameter('path', i) as string;
							toolArgs.new_name = this.getNodeParameter('newName', i) as string;
							break;

						default:
							throw new NodeOperationError(
								this.getNode(),
								`Unknown file operation: ${operation}`,
								{ itemIndex: i },
							);
					}
				} else if (resource === 'directory') {
					switch (operation) {
						case 'list':
							toolName = 'ctera_portal_list_dir';
							toolArgs.path = this.getNodeParameter('path', i) as string;
							toolArgs.include_deleted = this.getNodeParameter('includeDeleted', i) as boolean;
							break;

						case 'create': {
							const createParents = this.getNodeParameter('createParents', i) as boolean;
							toolName = createParents ? 'ctera_portal_makedirs' : 'ctera_portal_create_directory';
							toolArgs.path = this.getNodeParameter('path', i) as string;
							break;
						}

						case 'delete': {
							toolName = 'ctera_portal_delete_items';
							const dirPaths = (this.getNodeParameter('paths', i) as string)
								.split(',')
								.map((p) => p.trim())
								.filter((p) => p);
							toolArgs.paths = dirPaths;
							break;
						}

						case 'recover': {
							toolName = 'ctera_portal_recover_items';
							const recoverPaths = (this.getNodeParameter('paths', i) as string)
								.split(',')
								.map((p) => p.trim())
								.filter((p) => p);
							toolArgs.paths = recoverPaths;
							break;
						}

						case 'walk':
							toolName = 'ctera_portal_walk_tree';
							toolArgs.path = this.getNodeParameter('path', i) as string;
							toolArgs.include_deleted = this.getNodeParameter('includeDeleted', i) as boolean;
							break;

						default:
							throw new NodeOperationError(
								this.getNode(),
								`Unknown directory operation: ${operation}`,
								{ itemIndex: i },
							);
					}
				} else if (resource === 'version') {
					switch (operation) {
						case 'list':
							toolName = 'ctera_portal_list_versions';
							toolArgs.path = this.getNodeParameter('path', i) as string;
							break;

						default:
							throw new NodeOperationError(
								this.getNode(),
								`Unknown version operation: ${operation}`,
								{ itemIndex: i },
							);
					}
				} else if (resource === 'link') {
					switch (operation) {
						case 'createPublicLink':
							toolName = 'ctera_portal_create_public_link';
							toolArgs.path = this.getNodeParameter('path', i) as string;
							toolArgs.access = this.getNodeParameter('access', i) as string;
							toolArgs.expire_in = this.getNodeParameter('expireIn', i) as number;
							break;

						case 'getPermalink':
							toolName = 'ctera_portal_get_permalink';
							toolArgs.path = this.getNodeParameter('path', i) as string;
							break;

						default:
							throw new NodeOperationError(
								this.getNode(),
								`Unknown link operation: ${operation}`,
								{ itemIndex: i },
							);
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

			// Construct JSON-RPC 2.0 request
			const requestBody = {
				jsonrpc: '2.0',
				method: 'tools/call',
				params: {
					name: toolName,
					arguments: toolArgs,
				},
				id: i + 1,
			};

			// DEBUG: Log request
			console.log('🔍 MCP Request URL:', `${mcpServerUrl}/mcp/`);
			console.log('🔍 MCP Request Body:', JSON.stringify(requestBody, null, 2));

			// Make HTTP request to MCP server
			const response = await this.helpers.httpRequest({
				method: 'POST',
				url: `${mcpServerUrl}/mcp/`,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${bearerToken}`,
				},
				body: JSON.stringify(requestBody),
				skipSslCertificateValidation: allowUnauthorizedCerts,
			});

			// DEBUG: Log raw response
			console.log('🔍 MCP Raw Response:', JSON.stringify(response, null, 2));

			// Parse response
			const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;

			// DEBUG: Log parsed response
			console.log('🔍 MCP Parsed Response:', JSON.stringify(parsedResponse, null, 2));

				// Handle MCP error responses
				if (parsedResponse.error) {
					throw new NodeOperationError(
						this.getNode(),
						`MCP Error: ${parsedResponse.error.message || JSON.stringify(parsedResponse.error)}`,
						{ itemIndex: i },
					);
				}

			// Extract result from MCP response
			let result: unknown = null;
			if (parsedResponse.result && parsedResponse.result.content) {
				const content = parsedResponse.result.content[0];
				if (content && content.type === 'text') {
					try {
						// Convert Python syntax to JSON syntax
						let jsonText = content.text
							.replace(/'/g, '"')           // Single quotes to double quotes
							.replace(/None/g, 'null')     // Python None to JSON null
							.replace(/True/g, 'true')     // Python True to JSON true
							.replace(/False/g, 'false');  // Python False to JSON false
						
						result = JSON.parse(jsonText);
					} catch {
						result = content.text;
					}
				} else {
					result = content;
				}
			} else {
				result = parsedResponse.result;
			}

			// DEBUG: Log extracted result
			console.log('🔍 Extracted Result:', JSON.stringify(result, null, 2));
			console.log('🔍 Result is Array:', Array.isArray(result), 'Length:', Array.isArray(result) ? result.length : 'N/A');

			// Handle fan-out for list operations (directory list, walk, versions)
				if (
					(resource === 'directory' && (operation === 'list' || operation === 'walk')) ||
					(resource === 'version' && operation === 'list')
				) {
					if (Array.isArray(result) && result.length > 0) {
						for (const item of result) {
							returnData.push({
								json: {
									...items[i].json,
									resource,
									operation,
									...item,
								},
								pairedItem: { item: i },
							});
						}
					} else {
						// Empty result
						returnData.push({
							json: {
								...items[i].json,
								resource,
								operation,
								result: [],
							},
							pairedItem: { item: i },
						});
					}
				} else {
					// Single result operations
					returnData.push({
						json: {
							...items[i].json,
							resource,
							operation,
							result: result as string | number | boolean | object | null,
						},
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							...items[i].json,
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

