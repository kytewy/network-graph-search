import { NextRequest, NextResponse } from 'next/server';
import { llmError, openai } from '@/lib/utils/openai-client';
import { buildAnalyzeNodesPrompt, PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { LIMITS, badRequest, rateLimit } from '@/lib/utils/api-guard';
import { actionsInstruction, analyzeRequestSchema, extractActions, type ChatAction } from '@/lib/contracts/analysis';
import { buildReceipt, type Receipt } from '@/lib/chat/receipt';
import { BUDGET_CHARS, charsRead, READ_INSTRUCTION, READ_LIMITS, READ_TOOL, serveRead, type ReadingEvent } from '@/lib/chat/read-document';
import { checkInstruction, citationsToCheck } from '@/lib/chat/verify';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface Answer {
	summary: string;
	actions: ChatAction[];
	receipt: Receipt;
}

export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'llm');
	if (limited) return limited;

	try {
		const parsed = analyzeRequestSchema.safeParse(await request.json().catch(() => null));
		if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Invalid request');
		const { nodes, customPrompt, history, goal, actionOptions, stream } = parsed.data;

		if (nodes.length === 0 || nodes.length > LIMITS.MAX_NODES_LLM) {
			return badRequest(`Send between 1 and ${LIMITS.MAX_NODES_LLM} nodes`);
		}

		// Build prompt using centralized prompt library
		const prompt = buildAnalyzeNodesPrompt({
			nodes: nodes as unknown as Parameters<typeof buildAnalyzeNodesPrompt>[0]['nodes'],
			customPrompt,
			charLimitPerDoc: PROMPT_CONFIG.CHAR_LIMIT_GENERAL_ANALYSIS,
		});

		const answer = async (onRead?: (event: ReadingEvent) => void): Promise<Answer> => {
			// Earlier turns first, so follow-ups make sense; the documents ride
			// with the newest question, so they're always the current context
			const messages: ChatCompletionMessageParam[] = [
				...(goal?.trim() ? [{ role: 'system' as const, content: `The user's research goal: ${goal.trim()}\nKeep every answer aimed at this goal.` }] : []),
				...history,
				// What the answer may suggest changing, as buttons the user can click
				...(actionOptions ? [{ role: 'system' as const, content: actionsInstruction(actionOptions) }] : []),
				// Cut excerpts get read in full before they're cited
				{ role: 'system' as const, content: READ_INSTRUCTION },
				{ role: 'user' as const, content: prompt },
			];
			// The AI may read whole documents before answering (read_document), as
			// many rounds as it needs within the reading budget
			const read = new Map<string, number>();
			const refused = { count: 0 };
			const ask = (final: boolean) =>
				openai.chat.completions.create({
					model: PROMPT_CONFIG.MODEL,
					messages,
					temperature: PROMPT_CONFIG.TEMPERATURE_ANALYSIS,
					max_tokens: PROMPT_CONFIG.MAX_TOKENS_ANALYSIS,
					tools: [READ_TOOL],
					tool_choice: final ? 'none' : 'auto',
				});
			let response = await ask(false);
			let rounds = 0;
			for (let round = 1; response.choices[0].message.tool_calls?.length; round++) {
				rounds = round;
				const message = response.choices[0].message;
				messages.push(message);
				for (const call of message.tool_calls ?? []) {
					const args = call.type === 'function' ? call.function.arguments : '';
					const before = new Set(read.keys());
					messages.push({ role: 'tool', tool_call_id: call.id, content: serveRead(args, nodes, read, refused) });
					// Tell the browser as each document is opened
					for (const id of read.keys()) {
						if (before.has(id)) continue;
						const node = nodes.find((n) => n.id === id);
						onRead?.({ id, title: String(node?.name ?? node?.label ?? id), round });
					}
				}
				// The AI decides when to stop; the last round or a spent budget makes it answer
				response = await ask(round >= READ_LIMITS.MAX_ROUNDS || charsRead(read) >= BUDGET_CHARS);
			}

			// Check the draft: cited documents the AI only got an excerpt of are read
			// in full, and the AI keeps, fixes or removes the claims that rest on them
			const toCheck = citationsToCheck(response.choices[0].message.content ?? '', nodes, read);
			if (toCheck.length > 0) {
				const checked: string[] = [];
				messages.push({ role: 'assistant', content: response.choices[0].message.content ?? '' });
				toCheck.forEach((doc, i) => {
					const text = serveRead(JSON.stringify({ title: doc.title }), nodes, read, refused);
					if (!read.has(doc.id)) return; // the reading budget ran out
					checked.push(doc.title);
					messages.push({ role: 'system', content: `Full text of [${doc.title}]:\n${text}` });
					onRead?.({ id: doc.id, title: doc.title, round: rounds + 1, check: { index: i + 1, total: toCheck.length } });
				});
				if (checked.length > 0) {
					messages.push({ role: 'user', content: checkInstruction(checked) });
					response = await ask(true);
				}
			}

			// Exactly what went to the AI, shown as the answer's receipt
			const receipt = buildReceipt({
				nodes,
				messages: messages.map((m) => ({ content: typeof m.content === 'string' ? m.content : '' })),
				question: customPrompt,
				goal,
				suggestions: Boolean(actionOptions),
				memoryTurns: history.length / 2,
				read,
				readsRefused: refused.count,
				readRounds: rounds,
			});

			const text = response.choices[0].message.content || 'No analysis generated';
			// Suggested actions are checked against what's available; the rest is the answer
			const { text: summary, actions } = actionOptions ? extractActions(text, actionOptions) : { text, actions: [] };
			return { summary, actions, receipt };
		};

		if (!stream) return NextResponse.json(await answer());

		// Live: one line of JSON per document opened, then the answer (or the error)
		const encoder = new TextEncoder();
		const body = new ReadableStream({
			async start(controller) {
				const send = (line: object) => controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`));
				try {
					const result = await answer((event) => send({ type: 'reading', ...event }));
					send({ type: 'done', ...result });
				} catch (error) {
					const failed = llmError('analyze-nodes', error, 'Failed to analyze nodes');
					const { error: message } = await failed.json();
					send({ type: 'error', message, status: failed.status });
				}
				controller.close();
			},
		});
		return new Response(body, { headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' } });
	} catch (error) {
		return llmError('analyze-nodes', error, 'Failed to analyze nodes');
	}
}
