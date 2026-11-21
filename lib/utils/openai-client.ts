import OpenAI, { APIConnectionTimeoutError } from 'openai';
import { NextResponse } from 'next/server';
import { serverError } from '@/lib/utils/api-guard';

/**
 * Wait at most 20 s per attempt and retry twice (the SDK retries
 * timeouts, rate limits and 5xx errors with backoff), so a stuck call
 * fails in about a minute instead of hanging the request.
 */
export const OPENAI_SETTINGS = { timeout: 20_000, maxRetries: 2 } as const;

let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
	if (!_openai) {
		if (!process.env.OPENAI_API_KEY) {
			throw new Error('OPENAI_API_KEY is not set in environment variables');
		}
		_openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
			...OPENAI_SETTINGS,
		});
	}
	return _openai;
}

export const openai = new Proxy({} as OpenAI, {
	get(target, prop) {
		const client = getOpenAIClient();
		const value = (client as any)[prop];
		return typeof value === 'function' ? value.bind(client) : value;
	}
});

/**
 * Helper function to get JSON-formatted completion from GPT-4o-mini
 * @param prompt The prompt to send to the model
 * @returns Parsed JSON response
 */
export async function getJSONCompletion(prompt: string) {
	const response = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [{ role: 'user', content: prompt }],
		response_format: { type: 'json_object' },
		temperature: 0.3,
	});

	return parseJSONObject(response.choices[0].message.content);
}

/**
 * Parses a model reply as a JSON object. Broken, truncated or non-object
 * replies give {} so callers fall back to defaults instead of throwing.
 */
export function parseJSONObject(text: string | null | undefined): Record<string, unknown> {
	if (!text) return {};
	const unfenced = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
	try {
		const value = JSON.parse(unfenced);
		return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
	} catch {
		return {};
	}
}

/** Error response for an LLM route: 504 when OpenAI timed out, otherwise 500. */
export function llmError(context: string, error: unknown, message = 'Internal server error') {
	if (error instanceof APIConnectionTimeoutError) {
		console.error(`[${context}] OpenAI timed out`);
		return NextResponse.json(
			{ error: 'The AI took too long to respond. Please try again.' },
			{ status: 504 }
		);
	}
	return serverError(context, error, message);
}
