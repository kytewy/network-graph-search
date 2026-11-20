/**
 * @jest-environment node
 */

/**
 * API guard and route validation tests
 *
 * Covers the protections on public routes:
 * 1. Rate limiting per IP
 * 2. Input limits on the LLM route
 * 3. Generic error messages (no internal details sent to the client)
 * 4. Tag writes turned off in production unless explicitly allowed
 */

import { NextRequest } from 'next/server';
import {
	LIMITS,
	RATE_LIMITS,
	rateLimit,
	resetRateLimits,
	tagWritesAllowed,
	truncate,
} from '@/lib/utils/api-guard';

jest.mock('@/lib/utils/openai-client', () => ({
	openai: {
		chat: {
			completions: {
				create: jest.fn(),
			},
		},
	},
}));

import { openai } from '@/lib/utils/openai-client';
import { POST as analyzeNodes } from '@/app/api/analyze-nodes/route';

const mockCreate = openai.chat.completions.create as jest.Mock;

function makeRequest(body: unknown, ip = '1.2.3.4') {
	return new NextRequest('http://localhost/api/test', {
		method: 'POST',
		body: JSON.stringify(body),
		headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
	});
}

const sampleNode = { id: 'A1', label: 'Article 1', content: 'Text', summary: 'Summary' };

describe('rateLimit', () => {
	beforeEach(() => resetRateLimits());

	it('allows requests up to the limit, then returns 429', () => {
		const { limit } = RATE_LIMITS.llm;
		for (let i = 0; i < limit; i++) {
			expect(rateLimit(makeRequest({}), 'llm')).toBeNull();
		}
		const blocked = rateLimit(makeRequest({}), 'llm');
		expect(blocked?.status).toBe(429);
		expect(blocked?.headers.get('Retry-After')).toBeTruthy();
	});

	it('tracks each IP separately', () => {
		const { limit } = RATE_LIMITS.llm;
		for (let i = 0; i < limit; i++) rateLimit(makeRequest({}, '10.0.0.1'), 'llm');
		expect(rateLimit(makeRequest({}, '10.0.0.1'), 'llm')?.status).toBe(429);
		expect(rateLimit(makeRequest({}, '10.0.0.2'), 'llm')).toBeNull();
	});
});

describe('truncate', () => {
	it('cuts long strings and returns empty for non-strings', () => {
		expect(truncate('abcdef', 3)).toBe('abc');
		expect(truncate('ab', 3)).toBe('ab');
		expect(truncate(42, 3)).toBe('');
	});
});

describe('tagWritesAllowed', () => {
	const env = process.env as Record<string, string | undefined>;
	const original = { ...process.env };
	afterEach(() => {
		env.NODE_ENV = original.NODE_ENV;
		env.ALLOW_TAG_WRITES = original.ALLOW_TAG_WRITES;
	});

	it('is off in production by default', () => {
		env.NODE_ENV = 'production';
		delete env.ALLOW_TAG_WRITES;
		expect(tagWritesAllowed()).toBe(false);
	});

	it('can be turned on in production with ALLOW_TAG_WRITES=true', () => {
		env.NODE_ENV = 'production';
		env.ALLOW_TAG_WRITES = 'true';
		expect(tagWritesAllowed()).toBe(true);
	});

	it('is on in development', () => {
		env.NODE_ENV = 'development';
		expect(tagWritesAllowed()).toBe(true);
	});
});

describe('POST /api/analyze-nodes', () => {
	beforeEach(() => {
		resetRateLimits();
		mockCreate.mockReset();
	});

	it('rejects too many nodes without calling OpenAI', async () => {
		const nodes = Array.from({ length: LIMITS.MAX_NODES_LLM + 1 }, () => sampleNode);
		const res = await analyzeNodes(makeRequest({ nodes }));
		expect(res.status).toBe(400);
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('rejects an oversized custom prompt without calling OpenAI', async () => {
		const res = await analyzeNodes(
			makeRequest({ nodes: [sampleNode], customPrompt: 'x'.repeat(LIMITS.MAX_PROMPT_CHARS + 1) })
		);
		expect(res.status).toBe(400);
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('returns the summary for a valid request', async () => {
		mockCreate.mockResolvedValue({ choices: [{ message: { content: 'A summary' } }] });
		const res = await analyzeNodes(makeRequest({ nodes: [sampleNode], customPrompt: 'Summarize' }));
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ summary: 'A summary' });
	});

	it('hides internal error details from the client', async () => {
		mockCreate.mockRejectedValue(new Error('secret upstream failure'));
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		const res = await analyzeNodes(makeRequest({ nodes: [sampleNode] }));
		const body = await res.json();
		expect(res.status).toBe(500);
		expect(JSON.stringify(body)).not.toContain('secret upstream failure');
		spy.mockRestore();
	});
});
