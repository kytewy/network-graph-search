import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { llmError, openai } from '@/lib/utils/openai-client';
import { PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { badRequest, rateLimit } from '@/lib/utils/api-guard';
import { chatTitle } from '@/lib/chat/chat-title';

const request = z.object({
	question: z.string().min(1).max(2_000),
	answer: z.string().max(4_000).default(''),
});

/** A short name for a new chat, written from its first question and answer (as Claude names chats) */
export async function POST(req: NextRequest) {
	const limited = rateLimit(req, 'llm');
	if (limited) return limited;
	try {
		const parsed = request.safeParse(await req.json().catch(() => null));
		if (!parsed.success) return badRequest('Send the first question and answer');
		const { question, answer } = parsed.data;
		const response = await openai.chat.completions.create({
			model: PROMPT_CONFIG.MODEL,
			temperature: 0.2,
			max_tokens: 20,
			messages: [
				{
					role: 'system',
					content: 'Name this research conversation in 3 to 6 words, sentence case, no quotes and no full stop. Name the topic, not the question form.',
				},
				{ role: 'user', content: `Question: ${question}\n\nAnswer (start): ${answer.slice(0, 1_500)}` },
			],
		});
		return NextResponse.json({ title: chatTitle(response.choices[0].message.content ?? '') });
	} catch (error) {
		return llmError('chat-title', error, 'Could not name the chat');
	}
}
