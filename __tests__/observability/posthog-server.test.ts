/**
 * @jest-environment node
 */

/**
 * Server-side error reporting to PostHog. Off unless a project token is
 * set, so dev, tests and forks without a key send nothing.
 */

const captureException = jest.fn();
const constructed: Array<{ token: string; options: Record<string, unknown> }> = [];

jest.mock('posthog-node', () => ({
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
import { serverError } from '@/lib/utils/api-guard';
import { onRequestError } from '@/instrumentation';

const TOKEN = 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN';

beforeEach(() => {
	delete process.env[TOKEN];
	delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
	resetPostHogServer();
	captureException.mockClear();
	constructed.length = 0;
	jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

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
