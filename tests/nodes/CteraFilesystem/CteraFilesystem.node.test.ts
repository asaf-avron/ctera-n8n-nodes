/**
 * Unit tests for CteraFilesystem n8n node
 * Tests all filesystem operations using mocks (no real MCP/Portal needed)
 */
import { CteraFilesystem } from '../../../nodes/CteraFilesystem/CteraFilesystem.node';
import { createMockExecuteFunctions } from './mocks/ExecuteFunctions.mock';
import {
	mockListDirectoryResponse,
	mockEmptyDirectoryResponse,
	mockCreateDirectoryResponse,
	mockWalkDirectoryResponse,
	mockReadFileResponse,
	mockWriteFileResponse,
	mockDeleteResponse,
	mockCopyResponse,
	mockMoveResponse,
	mockRenameResponse,
	mockListVersionsResponse,
	mockCreatePublicLinkResponse,
	mockGetPermalinkResponse,
	mockRecoverResponse,
	mockErrorNotFound,
	mockErrorPermissionDenied,
	createSuccessResponse,
	createErrorResponse,
} from './mocks/McpResponses.mock';

describe('CteraFilesystem Node', () => {
	let cteraFilesystem: CteraFilesystem;

	beforeEach(() => {
		cteraFilesystem = new CteraFilesystem();
	});

	describe('Node Description', () => {
		it('should have correct metadata', () => {
			expect(cteraFilesystem.description.displayName).toBe('CTERA Filesystem');
			expect(cteraFilesystem.description.name).toBe('cteraFilesystem');
			expect(cteraFilesystem.description.icon).toBe('file:ctera.svg');
			expect(cteraFilesystem.description.credentials).toHaveLength(2);
			const credentialNames = cteraFilesystem.description.credentials?.map((c) => c.name);
			expect(credentialNames).toContain('cteraFilesystemApi');
			expect(credentialNames).toContain('cteraPortalOAuth2Api');
		});

		it('should define all resources', () => {
			const resourceProperty = cteraFilesystem.description.properties.find(
				(p) => p.name === 'resource'
			);
			expect(resourceProperty).toBeDefined();
			expect(resourceProperty?.type).toBe('options');
			
			const options = (resourceProperty as any)?.options;
			expect(options).toHaveLength(4);
			
			const values = options.map((o: any) => o.value);
			expect(values).toContain('file');
			expect(values).toContain('directory');
			expect(values).toContain('version');
			expect(values).toContain('link');
		});
	});

	describe('Directory Operations', () => {
		describe('list', () => {
			it('should list directory contents', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'directory',
						operation: 'list',
						path: '/CloudFolders/test',
						includeDeleted: false,
					},
				});
				mockExecute.setHttpResponse(mockListDirectoryResponse);

				const result = await cteraFilesystem.execute.call(mockExecute);

				// Verify HTTP request was made correctly
				expect(mockExecute.helpers.httpRequest).toHaveBeenCalledTimes(1);
				const requestCall = mockExecute.httpRequestCalls[0];
				expect(requestCall.options.method).toBe('POST');
				expect(requestCall.options.url).toContain('/mcp/');
				expect(requestCall.options.headers?.Authorization).toBe('Bearer mock-jwt-token-for-testing');
				
				// Verify the JSON-RPC body
				const body = JSON.parse(requestCall.options.body as string);
				expect(body.method).toBe('tools/call');
				expect(body.params.name).toBe('ctera_portal_list_dir');
				expect(body.params.arguments.path).toBe('/CloudFolders/test');
				expect(body.params.arguments.include_deleted).toBe(false);

				// Verify fan-out result (3 items from mock)
				expect(result).toHaveLength(1); // One array of results
				expect(result[0]).toHaveLength(3); // 3 items from directory
			});

			it('should handle empty directory', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'directory',
						operation: 'list',
						path: '/CloudFolders/empty',
						includeDeleted: false,
					},
				});
				mockExecute.setHttpResponse(mockEmptyDirectoryResponse);

				const result = await cteraFilesystem.execute.call(mockExecute);

				expect(result[0]).toHaveLength(1);
				expect(result[0][0].json.result).toEqual([]);
			});
		});

		describe('create', () => {
			it('should create directory without parents', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'directory',
						operation: 'create',
						path: '/CloudFolders/new-folder',
						createParents: false,
					},
				});
				mockExecute.setHttpResponse(mockCreateDirectoryResponse);

				const result = await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_create_directory');
				expect(body.params.arguments.path).toBe('/CloudFolders/new-folder');

				expect(result[0]).toHaveLength(1);
				expect(result[0][0].json.result).toHaveProperty('success', true);
			});

			it('should create directory with parents (makedirs)', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'directory',
						operation: 'create',
						path: '/CloudFolders/deep/nested/folder',
						createParents: true,
					},
				});
				mockExecute.setHttpResponse(mockCreateDirectoryResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_makedirs');
			});
		});

		describe('delete', () => {
			it('should delete multiple directories', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'directory',
						operation: 'delete',
						paths: '/folder1, /folder2, /folder3',
					},
				});
				mockExecute.setHttpResponse(mockDeleteResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_delete_items');
				expect(body.params.arguments.paths).toEqual(['/folder1', '/folder2', '/folder3']);
			});
		});

		describe('walk', () => {
			it('should walk directory tree', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'directory',
						operation: 'walk',
						path: '/CloudFolders/project',
						includeDeleted: false,
					},
				});
				mockExecute.setHttpResponse(mockWalkDirectoryResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_walk_tree');
				expect(body.params.arguments.include_deleted).toBe(false);
			});
		});

		describe('recover', () => {
			it('should recover deleted items', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'directory',
						operation: 'recover',
						paths: '/deleted-file.txt',
					},
				});
				mockExecute.setHttpResponse(mockRecoverResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_recover_items');
				expect(body.params.arguments.paths).toEqual(['/deleted-file.txt']);
			});
		});
	});

	describe('File Operations', () => {
		describe('read', () => {
			it('should read file contents', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'file',
						operation: 'read',
						path: '/CloudFolders/documents/readme.txt',
					},
				});
				mockExecute.setHttpResponse(mockReadFileResponse);

				const result = await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_read_file');
				expect(body.params.arguments.path).toBe('/CloudFolders/documents/readme.txt');

				expect(result[0][0].json.result).toBe('Hello, this is the file content!');
			});
		});

		describe('write', () => {
			it('should write content to file', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'file',
						operation: 'write',
						path: '/CloudFolders/output.txt',
						content: 'This is the new file content',
					},
				});
				mockExecute.setHttpResponse(mockWriteFileResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_upload_from_content');
				expect(body.params.arguments.filepath).toBe('/CloudFolders/output.txt');
				expect(body.params.arguments.content).toBe('This is the new file content');
			});
		});

		describe('delete', () => {
			it('should delete files', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'file',
						operation: 'delete',
						paths: '/file1.txt, /file2.txt',
					},
				});
				mockExecute.setHttpResponse(mockDeleteResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_delete_items');
				expect(body.params.arguments.paths).toEqual(['/file1.txt', '/file2.txt']);
			});
		});

		describe('copy', () => {
			it('should copy file to destination', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'file',
						operation: 'copy',
						path: '/CloudFolders/source.txt',
						destination: '/CloudFolders/backup/source-copy.txt',
					},
				});
				mockExecute.setHttpResponse(mockCopyResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_copy_item');
				expect(body.params.arguments.source).toBe('/CloudFolders/source.txt');
				expect(body.params.arguments.destination).toBe('/CloudFolders/backup/source-copy.txt');
			});
		});

		describe('move', () => {
			it('should move file to new location', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'file',
						operation: 'move',
						path: '/CloudFolders/old-location.txt',
						destination: '/CloudFolders/archive/moved-file.txt',
					},
				});
				mockExecute.setHttpResponse(mockMoveResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_move_item');
				expect(body.params.arguments.source).toBe('/CloudFolders/old-location.txt');
				expect(body.params.arguments.destination).toBe('/CloudFolders/archive/moved-file.txt');
			});
		});

		describe('rename', () => {
			it('should rename file', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'file',
						operation: 'rename',
						path: '/CloudFolders/old-name.txt',
						newName: 'new-name.txt',
					},
				});
				mockExecute.setHttpResponse(mockRenameResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_rename_item');
				expect(body.params.arguments.path).toBe('/CloudFolders/old-name.txt');
				expect(body.params.arguments.new_name).toBe('new-name.txt');
			});
		});
	});

	describe('Version Operations', () => {
		describe('list', () => {
			it('should list file versions', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'version',
						operation: 'list',
						path: '/CloudFolders/versioned-file.txt',
					},
				});
				mockExecute.setHttpResponse(mockListVersionsResponse);

				const result = await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_list_versions');
				expect(body.params.arguments.path).toBe('/CloudFolders/versioned-file.txt');

				// Should fan out 3 versions
				expect(result[0]).toHaveLength(3);
				expect(result[0][0].json.version).toBe(1);
				expect(result[0][2].json.version).toBe(3);
			});
		});
	});

	describe('Link Operations', () => {
		describe('createPublicLink', () => {
			it('should create public link with read-only access', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'link',
						operation: 'createPublicLink',
						path: '/CloudFolders/shared-document.pdf',
						access: 'RO',
						expireIn: 30,
					},
				});
				mockExecute.setHttpResponse(mockCreatePublicLinkResponse);

				const result = await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_create_public_link');
				expect(body.params.arguments.path).toBe('/CloudFolders/shared-document.pdf');
				expect(body.params.arguments.access).toBe('RO');
				expect(body.params.arguments.expire_in).toBe(30);

				expect(result[0][0].json.result).toHaveProperty('url');
				expect(result[0][0].json.result).toHaveProperty('accessKey');
			});

			it('should create public link with read-write access', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'link',
						operation: 'createPublicLink',
						path: '/CloudFolders/collaborative.docx',
						access: 'RW',
						expireIn: 7,
					},
				});
				mockExecute.setHttpResponse(mockCreatePublicLinkResponse);

				await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.arguments.access).toBe('RW');
				expect(body.params.arguments.expire_in).toBe(7);
			});
		});

		describe('getPermalink', () => {
			it('should get permalink for file', async () => {
				const mockExecute = createMockExecuteFunctions({
					nodeParameters: {
						resource: 'link',
						operation: 'getPermalink',
						path: '/CloudFolders/permanent-file.txt',
					},
				});
				mockExecute.setHttpResponse(mockGetPermalinkResponse);

				const result = await cteraFilesystem.execute.call(mockExecute);

				const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
				expect(body.params.name).toBe('ctera_portal_get_permalink');
				expect(body.params.arguments.path).toBe('/CloudFolders/permanent-file.txt');

				expect(result[0][0].json.result).toContain('permalink');
			});
		});
	});

	describe('Error Handling', () => {
		it('should throw NodeOperationError on MCP error response', async () => {
			const mockExecute = createMockExecuteFunctions({
				nodeParameters: {
					resource: 'file',
					operation: 'read',
					path: '/nonexistent/file.txt',
				},
			});
			mockExecute.setHttpResponse(mockErrorNotFound);

			await expect(cteraFilesystem.execute.call(mockExecute)).rejects.toThrow(
				'MCP Error: Path not found: /nonexistent/path'
			);
		});

		it('should throw NodeOperationError on permission denied', async () => {
			const mockExecute = createMockExecuteFunctions({
				nodeParameters: {
					resource: 'file',
					operation: 'delete',
					paths: '/protected/file.txt',
				},
			});
			mockExecute.setHttpResponse(mockErrorPermissionDenied);

			await expect(cteraFilesystem.execute.call(mockExecute)).rejects.toThrow(
				'MCP Error: Permission denied'
			);
		});

		it('should throw on unknown resource', async () => {
			const mockExecute = createMockExecuteFunctions({
				nodeParameters: {
					resource: 'unknown',
					operation: 'list',
				},
			});

			await expect(cteraFilesystem.execute.call(mockExecute)).rejects.toThrow(
				'Unknown resource: unknown'
			);
		});

		it('should throw on unknown file operation', async () => {
			const mockExecute = createMockExecuteFunctions({
				nodeParameters: {
					resource: 'file',
					operation: 'unknownOp',
				},
			});

			await expect(cteraFilesystem.execute.call(mockExecute)).rejects.toThrow(
				'Unknown file operation: unknownOp'
			);
		});

		it('should continue on fail when enabled', async () => {
			const mockExecute = createMockExecuteFunctions({
				nodeParameters: {
					resource: 'file',
					operation: 'read',
					path: '/error.txt',
				},
				continueOnFail: true,
			});
			mockExecute.setHttpResponse(mockErrorNotFound);

			const result = await cteraFilesystem.execute.call(mockExecute);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.error).toContain('MCP Error');
		});
	});

	describe('Credentials & Authentication', () => {
		it('should use custom server URL from credentials', async () => {
			const mockExecute = createMockExecuteFunctions({
				credentials: {
					serverUrl: 'https://custom-mcp.example.com/api',
					bearerToken: 'custom-token-123',
				},
				nodeParameters: {
					resource: 'file',
					operation: 'read',
					path: '/test.txt',
				},
			});
			mockExecute.setHttpResponse(mockReadFileResponse);

			await cteraFilesystem.execute.call(mockExecute);

			const requestCall = mockExecute.httpRequestCalls[0];
			expect(requestCall.options.url).toBe('https://custom-mcp.example.com/api/mcp/');
			expect(requestCall.options.headers?.Authorization).toBe('Bearer custom-token-123');
		});

		it('should strip trailing slash from server URL', async () => {
			const mockExecute = createMockExecuteFunctions({
				credentials: {
					serverUrl: 'https://mcp.example.com/',
					bearerToken: 'token',
				},
				nodeParameters: {
					resource: 'file',
					operation: 'read',
					path: '/test.txt',
				},
			});
			mockExecute.setHttpResponse(mockReadFileResponse);

			await cteraFilesystem.execute.call(mockExecute);

			expect(mockExecute.httpRequestCalls[0].options.url).toBe('https://mcp.example.com/mcp/');
		});

		it('should respect allowUnauthorizedCerts setting', async () => {
			const mockExecute = createMockExecuteFunctions({
				credentials: {
					allowUnauthorizedCerts: true,
				},
				nodeParameters: {
					resource: 'file',
					operation: 'read',
					path: '/test.txt',
				},
			});
			mockExecute.setHttpResponse(mockReadFileResponse);

			await cteraFilesystem.execute.call(mockExecute);

			expect(mockExecute.httpRequestCalls[0].options.skipSslCertificateValidation).toBe(true);
		});
	});

	describe('JSON-RPC Protocol', () => {
		it('should send valid JSON-RPC 2.0 requests', async () => {
			const mockExecute = createMockExecuteFunctions({
				nodeParameters: {
					resource: 'directory',
					operation: 'list',
					path: '/test',
					includeDeleted: false,
				},
			});
			mockExecute.setHttpResponse(mockListDirectoryResponse);

			await cteraFilesystem.execute.call(mockExecute);

			const body = JSON.parse(mockExecute.httpRequestCalls[0].options.body as string);
			expect(body.jsonrpc).toBe('2.0');
			expect(body.method).toBe('tools/call');
			expect(body.id).toBe(1);
			expect(body.params).toHaveProperty('name');
			expect(body.params).toHaveProperty('arguments');
		});

		it('should increment request ID for each item', async () => {
			const mockExecute = createMockExecuteFunctions({
				inputData: [{ json: { idx: 0 } }, { json: { idx: 1 } }, { json: { idx: 2 } }],
				nodeParameters: {
					resource: 'file',
					operation: 'read',
					path: '/file.txt',
				},
			});
			mockExecute.setHttpResponse(mockReadFileResponse);

			await cteraFilesystem.execute.call(mockExecute);

			expect(mockExecute.httpRequestCalls.length).toBe(3);
			
			const ids = mockExecute.httpRequestCalls.map(
				(call) => JSON.parse(call.options.body as string).id
			);
			expect(ids).toEqual([1, 2, 3]);
		});
	});

	describe('Multiple Input Items', () => {
		it('should process multiple input items', async () => {
			const mockExecute = createMockExecuteFunctions({
				inputData: [
					{ json: { file: 'a.txt' } },
					{ json: { file: 'b.txt' } },
				],
				nodeParameters: {
					resource: 'file',
					operation: 'read',
					path: '/test.txt',
				},
			});
			mockExecute.setHttpResponse(mockReadFileResponse);

			const result = await cteraFilesystem.execute.call(mockExecute);

			expect(mockExecute.helpers.httpRequest).toHaveBeenCalledTimes(2);
			expect(result[0]).toHaveLength(2);
		});
	});
});

