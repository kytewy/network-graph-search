/**
 * @vitest-environment node
 */

/**
 * OpenAI calls: bounded wait, a couple of retries, and replies that
 * can't crash the route when the model returns broken JSON.
 */

import { APIConnectionTimeoutError } from 'openai';

const create = vi.fn();
const constructed: Array<Record<string, unknown>> = [];

vi.mock('openai', async () => {
	const actual = await vi.importActual<Record<string, unknown>>('openai');
	class FakeOpenAI {
		chat = { completions: { create } };
		constructor(options: Record<string, unknown>) {
			constructed.push(options);
		}
	}
	return { __esModule: true, ...actual, default: FakeOpenAI };
});

import {
	OPENAI_SETTINGS,
	getJSONCompletion,
	llmError,
	openai,
	parseJSONObject,
} from '@/lib/utils/openai-client';

const reply = (content: string | null) => ({ choices: [{ message: { content } }] });

beforeAll(() => {
	process.env.OPENAI_API_KEY = 'test-key';
});

describe('OpenAI client', () => {
	it('gives up after 20 seconds and retries twice', () => {
		void openai.chat;
		expect(constructed[0]).toMatchObject({ timeout: 20_000, maxRetries: 2 });
		expect(OPENAI_SETTINGS).toEqual({ timeout: 20_000, maxRetries: 2 });
	});
});

describe('parseJSONObject', () => {
	it('reads a JSON object', () => {
		expect(parseJSONObject('{"clusterName":"Privacy"}')).toEqual({ clusterName: 'Privacy' });
	});

	it('reads JSON wrapped in a code fence', () => {
		expect(parseJSONObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
	});

	it('returns an empty object for broken or non-object replies', () => {
		expect(parseJSONObject('{"clusterName": "Priv')).toEqual({});
		expect(parseJSONObject('[1,2]')).toEqual({});
		expect(parseJSONObject('"text"')).toEqual({});
		expect(parseJSONObject(null)).toEqual({});
	});
});

describe('getJSONCompletion', () => {
	it('does not throw when the model returns broken JSON', async () => {
		create.mockResolvedValueOnce(reply('not json at all'));
		await expect(getJSONCompletion('name this cluster')).resolves.toEqual({});
	});
});

describe('llmError', () => {
	it('answers 504 with a clear message when OpenAI times out', async () => {
		const response = llmError('test', new APIConnectionTimeoutError());
		expect(response.status).toBe(504);
		expect((await response.json()).error).toMatch(/took too long/i);
	});

	it('answers 500 for other failures', async () => {
		const response = llmError('test', new Error('boom'), 'Failed to analyze');
		expect(response.status).toBe(500);
		expect((await response.json()).error).toBe('Failed to analyze');
	});
});
