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
			displayName: 'Tenant ID',
			name: 'tenantId',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			description: 'Your Azure AD Tenant ID (from Azure Portal > App registrations)',
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
			type: 'hidden',
			default: '=https://login.microsoftonline.com/{{$self.tenantId}}/oauth2/v2.0/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: '=https://login.microsoftonline.com/{{$self.tenantId}}/oauth2/v2.0/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'openid profile offline_access',
			required: true,
			description: 'OAuth2 scopes. Add your API scope (e.g., api://your-client-id/access)',
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
		},
	};
}
