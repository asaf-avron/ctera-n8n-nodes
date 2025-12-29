import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CteraFilesystemApi implements ICredentialType {
	name = 'cteraFilesystemApi';
	displayName = 'CTERA Filesystem API';
	documentationUrl = 'https://github.com/ctera/ctera-n8n-nodes#readme';
	properties: INodeProperties[] = [
		{
			displayName: 'MCP Server URL',
			name: 'serverUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://mcp.your-domain.com',
			description: 'The base URL of your CTERA MCP server (e.g., https://mcp.example.com)',
		},
		{
			displayName: 'Bearer Token (JWT)',
			name: 'bearerToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Portal JWT token for authentication. Generate via Portal Settings → API Tokens, or using: curl -k "https://&lt;portal&gt;/api/tokens/generate?oid=&lt;oid&gt;&email=&lt;email&gt;"',
		},
		{
			displayName: 'Ignore SSL Issues',
			name: 'allowUnauthorizedCerts',
			type: 'boolean',
			default: false,
			description: 'Whether to connect even if SSL certificate validation fails (use for self-signed certificates)',
		},
	];
}



