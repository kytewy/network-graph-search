import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
	throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
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
