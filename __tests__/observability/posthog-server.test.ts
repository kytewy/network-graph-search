/**
 * @vitest-environment node
 */

/**
 * Server-side error reporting to PostHog. Off unless a project token is
 * set, so dev, tests and forks without a key send nothing.
 */

const captureException = vi.fn();
const constructed: Array<{ token: string; options: Record<string, unknown> }> = [];

vi.mock('posthog-node', () => ({
	PostHog: class {
		captureException = captureException;
		constructor(token: string, options: Record<string, unknown>) {
			constructed.push({ token, options });
		}
	},
}));

import {
	captureServerError,
	getPostHogServer,
	resetPostHogServer,
} from '@/lib/observability/posthog-server';
import { rateLimit, resetRateLimits, serverError } from '@/lib/utils/api-guard';
import { llmError } from '@/lib/utils/openai-client';
import { createPostHogLogger, setLogger } from '@/lib/observability/logger';
import { InMemoryLogRecordExporter } from '@opentelemetry/sdk-logs';
import { APIConnectionTimeoutError } from 'openai';
import { NextRequest } from 'next/server';
import { onRequestError } from '@/instrumentation';

const TOKEN = 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN';

beforeEach(() => {
	delete process.env[TOKEN];
	delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
	resetPostHogServer();
	captureException.mockClear();
	constructed.length = 0;
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('getPostHogServer', () => {
	it('is off without a project token', () => {
		expect(getPostHogServer()).toBeNull();
		captureServerError(new Error('boom'));
		expect(constructed).toHaveLength(0);
	});

	it('sends each error right away, to the US host by default', () => {
		process.env[TOKEN] = 'phc_test';
		expect(getPostHogServer()).not.toBeNull();
		expect(constructed[0]).toEqual({
			token: 'phc_test',
			options: expect.objectContaining({
				host: 'https://us.i.posthog.com',
				flushAt: 1,
				flushInterval: 0,
			}),
		});
	});
});

describe('API route errors', () => {
	it('serverError reports the caught error with the route name', async () => {
		process.env[TOKEN] = 'phc_test';
		const error = new Error('Pinecone down');
		const response = serverError('search', error, 'Search failed');

		expect(response.status).toBe(500);
		expect((await response.json()).error).toBe('Search failed');
		expect(captureException).toHaveBeenCalledWith(error, {
			properties: { context: 'search' },
		});
	});
});

describe('onRequestError', () => {
	const request = { path: '/api/search', method: 'POST', headers: {} };
	const context = { routerKind: 'App Router', routePath: '/api/search', routeType: 'route' } as const;

	it('reports uncaught server errors with the request path', async () => {
		process.env[TOKEN] = 'phc_test';
		const previous = process.env.NEXT_RUNTIME;
		process.env.NEXT_RUNTIME = 'nodejs';
		const error = new Error('uncaught');

		await onRequestError(error, request, context as any);
		process.env.NEXT_RUNTIME = previous;

		expect(captureException).toHaveBeenCalledWith(error, {
			properties: expect.objectContaining({ path: '/api/search', method: 'POST', routeType: 'route' }),
		});
	});
});

describe('gaps found in the logging audit', () => {
	let exporter: InMemoryLogRecordExporter;
	const logged = () => exporter.getFinishedLogRecords().map((r) => [r.severityText, r.body, r.attributes]);

	beforeEach(() => {
		process.env[TOKEN] = 'phc_test';
		exporter = new InMemoryLogRecordExporter();
		setLogger(createPostHogLogger({ token: 'phc_test', exporter }));
	});
	afterEach(() => setLogger(null));

	it('reports OpenAI timeouts, not just prints them', async () => {
		const error = new APIConnectionTimeoutError();
		const response = llmError('analyze-nodes', error);

		expect(response.status).toBe(504);
		expect(captureException).toHaveBeenCalledWith(error, {
			properties: { context: 'analyze-nodes', timeout: true },
		});
		expect(logged()).toEqual([['WARN', 'OpenAI timed out', { context: 'analyze-nodes' }]]);
	});

	it('logs a warning when someone hits a rate limit', () => {
		resetRateLimits();
		const request = new NextRequest('http://localhost/api/x', { headers: { 'x-forwarded-for': '1.2.3.4' } });
		let response = null;
		for (let i = 0; i < 25 && !response; i++) response = rateLimit(request, 'llm');

		expect(response?.status).toBe(429);
		expect(logged()).toEqual([['WARN', 'Rate limit hit', { group: 'llm' }]]);
	});

	it('documents/list reports errors and hides their details', async () => {
		vi.resetModules();
		vi.doMock('@pinecone-database/pinecone', () => ({
			Pinecone: class {
				index() {
					return { query: async () => { throw new Error('Vector dimension 1536 does not match 1024'); } };
				}
			},
		}));
		process.env.PINECONE_API_KEY = 'k';
		process.env.PINECONE_INDEX_NAME = 'i';
		const { GET } = await import('@/app/api/documents/list/route');
		const response = await GET(new NextRequest('http://localhost/api/documents/list'));
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(JSON.stringify(body)).not.toMatch(/dimension/);
		delete process.env.PINECONE_API_KEY;
		delete process.env.PINECONE_INDEX_NAME;
	});
});
