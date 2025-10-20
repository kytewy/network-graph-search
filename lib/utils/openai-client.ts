import OpenAI from 'openai';

let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
	if (!_openai) {
		if (!process.env.OPENAI_API_KEY) {
			throw new Error('OPENAI_API_KEY is not set in environment variables');
		}
		_openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
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

	return JSON.parse(response.choices[0].message.content || '{}');
}
