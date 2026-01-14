import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CteraPortalOAuth2Api implements ICredentialType {
	name = 'cteraPortalOAuth2Api';
	extends = ['oAuth2Api'];
	displayName = 'CTERA Portal OAuth2 API';
	documentationUrl = 'https://github.com/ctera/ctera-n8n-nodes#oauth2-setup';
	properties: INodeProperties[] = [
		{
			displayName: 'Portal URL',
			name: 'portalUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://your-portal.ctera.com',
			description: 'Base URL of your CTERA Portal',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://login.microsoftonline.com/YOUR-TENANT-ID/oauth2/v2.0/authorize',
			description: 'Azure AD authorization endpoint. Replace YOUR-TENANT-ID with your Azure tenant ID',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://login.microsoftonline.com/YOUR-TENANT-ID/oauth2/v2.0/token',
			description: 'Azure AD token endpoint. Replace YOUR-TENANT-ID with your Azure tenant ID',
		},
		{
			displayName: 'API Scope',
			name: 'apiScope',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'api://YOUR-CLIENT-ID/access',
			description: 'Your Azure AD API scope (e.g., api://client-id/access or api://client-id/claudeai). This is required for v2.0 tokens.',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '={{$self.apiScope}} openid profile offline_access',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
		{
			displayName: 'Ignore SSL Issues',
			name: 'allowUnauthorizedCerts',
			type: 'boolean',
			default: false,
			description: 'Whether to connect even if SSL certificate validation fails (use for self-signed certificates)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.oauthTokenData.access_token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.portalUrl}}/_SRV/MCP',
			url: '/mcp',
			method: 'POST',
			body: {
				jsonrpc: '2.0',
				method: 'tools/call',
				params: {
					name: 'ctera_portal_who_am_i',
					arguments: {},
				},
				id: 1,
			},
			skipSslCertificateValidation: '={{$credentials.allowUnauthorizedCerts}}',
		},
	};
}
