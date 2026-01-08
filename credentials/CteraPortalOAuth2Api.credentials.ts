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
	documentationUrl = 'https://github.com/ctera/ctera-n8n-nodes#readme';
	properties: INodeProperties[] = [
		{
			displayName: 'Portal URL',
			name: 'portalUrl',
			type: 'string',
			default: 'https://udi.ctera.me',
			required: true,
			placeholder: 'https://udi.ctera.me',
			description: 'Base URL of your CTERA Portal (without /_SRV/MCP/mcp)',
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
		default: 'https://login.microsoftonline.com/bc628184-c9ef-43d6-b578-c5da746783ab/oauth2/v2.0/authorize',
		required: true,
		description: 'OAuth2 authorization endpoint (replace tenant ID if different)',
	},
	{
		displayName: 'Access Token URL',
		name: 'accessTokenUrl',
		type: 'string',
		default: 'https://login.microsoftonline.com/bc628184-c9ef-43d6-b578-c5da746783ab/oauth2/v2.0/token',
		required: true,
		description: 'OAuth2 token endpoint (replace tenant ID if different)',
	},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'api://524e4423-a684-4c70-82f2-33b0168e8e87/claudeai openid profile offline_access',
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
