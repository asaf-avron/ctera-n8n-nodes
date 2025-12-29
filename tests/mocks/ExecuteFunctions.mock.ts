/**
 * Mock implementation of IExecuteFunctions for testing n8n nodes
 * without requiring a real n8n runtime or MCP service.
 */
import type {
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
	INode,
	IHttpRequestOptions,
	ICredentialDataDecryptedObject,
} from 'n8n-workflow';

export interface MockCredentials {
	serverUrl: string;
	bearerToken: string;
	allowUnauthorizedCerts: boolean;
}

export interface MockHttpRequestCall {
	options: IHttpRequestOptions;
}

/**
 * Creates a mock IExecuteFunctions object for testing
 */
export function createMockExecuteFunctions(options: {
	credentials?: Partial<MockCredentials>;
	inputData?: INodeExecutionData[];
	nodeParameters?: Record<string, unknown>;
	continueOnFail?: boolean;
}): jest.Mocked<IExecuteFunctions> & { 
	httpRequestCalls: MockHttpRequestCall[];
	setHttpResponse: (response: unknown) => void;
	setHttpError: (error: Error) => void;
} {
	const {
		credentials = {},
		inputData = [{ json: {} }],
		nodeParameters = {},
		continueOnFail = false,
	} = options;

	// Track HTTP request calls for assertions
	const httpRequestCalls: MockHttpRequestCall[] = [];
	let httpResponse: unknown = {};
	let httpError: Error | null = null;

	const defaultCredentials: MockCredentials = {
		serverUrl: 'http://mock-mcp:81/_SRV/MCP',
		bearerToken: 'mock-jwt-token-for-testing',
		allowUnauthorizedCerts: false,
		...credentials,
	};

	// Create parameter getter that tracks index
	let parameterCallIndex = 0;
	const parameterValues: unknown[] = [];
	
	const getNodeParameter = jest.fn((
		parameterName: string,
		itemIndex: number,
		fallbackValue?: unknown,
	): unknown => {
		// If specific parameters are provided, use them
		if (nodeParameters[parameterName] !== undefined) {
			const value = nodeParameters[parameterName];
			// Handle array of values for sequential calls
			if (Array.isArray(value) && parameterValues.length === 0) {
				parameterValues.push(...value);
			}
			if (parameterValues.length > 0) {
				return parameterValues.shift();
			}
			return value;
		}
		return fallbackValue;
	});

	const mockHelpers = {
		httpRequest: jest.fn(async (requestOptions: IHttpRequestOptions) => {
			httpRequestCalls.push({ options: requestOptions });
			if (httpError) {
				throw httpError;
			}
			return httpResponse;
		}),
		returnJsonArray: jest.fn((items: IDataObject[]): INodeExecutionData[] => {
			return items.map((item) => ({ json: item }));
		}),
		constructExecutionMetaData: jest.fn(
			(inputData: INodeExecutionData[], options: { itemData: { item: number } }) => inputData
		),
	};

	const mockFunctions = {
		getInputData: jest.fn(() => inputData),
		getNodeParameter,
		getCredentials: jest.fn(async (type: string): Promise<ICredentialDataDecryptedObject> => {
			return defaultCredentials as unknown as ICredentialDataDecryptedObject;
		}),
		helpers: mockHelpers,
		continueOnFail: jest.fn(() => continueOnFail),
		getNode: jest.fn((): INode => ({
			id: 'test-node-id',
			name: 'CTERA Filesystem',
			type: 'n8n-nodes-ctera.cteraFilesystem',
			typeVersion: 1,
			position: [0, 0],
			parameters: {},
		})),
		getItemIndex: jest.fn(() => 0),
		// Additional methods that might be needed
		getWorkflow: jest.fn(() => ({ id: 'test-workflow', name: 'Test Workflow' })),
		getMode: jest.fn(() => 'manual'),
		getRestApiUrl: jest.fn(() => 'http://localhost:5678'),
	} as unknown as jest.Mocked<IExecuteFunctions>;

	// Add tracking properties
	const enhancedMock = mockFunctions as jest.Mocked<IExecuteFunctions> & {
		httpRequestCalls: MockHttpRequestCall[];
		setHttpResponse: (response: unknown) => void;
		setHttpError: (error: Error) => void;
	};

	enhancedMock.httpRequestCalls = httpRequestCalls;
	enhancedMock.setHttpResponse = (response: unknown) => {
		httpResponse = response;
		httpError = null;
	};
	enhancedMock.setHttpError = (error: Error) => {
		httpError = error;
	};

	return enhancedMock;
}

/**
 * Helper to set up sequential parameter returns
 */
export function setupNodeParameters(
	mock: jest.Mocked<IExecuteFunctions>,
	...values: unknown[]
): void {
	let callIndex = 0;
	(mock.getNodeParameter as jest.Mock).mockImplementation(() => {
		const value = values[callIndex];
		callIndex++;
		return value;
	});
}

