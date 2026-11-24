import { analyzeRequestSchema, chatMemory, CHAT_LIMITS } from '@/lib/contracts/analysis';
import { shouldRetry } from '@/lib/api/http';

const turn = (n: number) => ({ prompt: `question ${n}`, response: `answer ${n}` });

describe('chatMemory', () => {
	it('keeps the last 6 turns, oldest first, as user/assistant pairs', () => {
		const memory = chatMemory(Array.from({ length: 8 }, (_, i) => turn(i + 1)));
		expect(memory).toHaveLength(12);
		expect(memory[0]).toEqual({ role: 'user', content: 'question 3' });
		expect(memory.at(-1)).toEqual({ role: 'assistant', content: 'answer 8' });
	});

	it('cuts long messages so they always pass the rules', () => {
		const [, answer] = chatMemory([{ prompt: 'q', response: 'x'.repeat(10_000) }]);
		expect(answer.content).toHaveLength(CHAT_LIMITS.MAX_MEMORY_CHARS);
		expect(analyzeRequestSchema.safeParse({ nodes: [{}], history: chatMemory([{ prompt: 'q', response: 'x'.repeat(10_000) }]) }).success).toBe(true);
	});
});

describe('analyzeRequestSchema', () => {
	it('accepts a question with no memory', () => {
		expect(analyzeRequestSchema.parse({ nodes: [{ id: 'a' }], customPrompt: 'hi' }).history).toEqual([]);
	});

	it('rejects too much memory, a bad role and an overlong question', () => {
		const tooMany = Array.from({ length: CHAT_LIMITS.MEMORY_TURNS * 2 + 1 }, () => ({ role: 'user', content: 'x' }));
		expect(analyzeRequestSchema.safeParse({ nodes: [], history: tooMany }).success).toBe(false);
		expect(analyzeRequestSchema.safeParse({ nodes: [], history: [{ role: 'system', content: 'x' }] }).success).toBe(false);
		expect(analyzeRequestSchema.safeParse({ nodes: [], customPrompt: 'x'.repeat(2001) }).success).toBe(false);
	});
});

describe('shouldRetry', () => {
	it('never retries a request the user stopped', () => {
		expect(shouldRetry(0, new DOMException('stopped', 'AbortError'))).toBe(false);
		expect(shouldRetry(0, new TypeError('network'))).toBe(true);
	});
});

describe('actionOptions', () => {
	it('never blocks a question: options that break the rules are dropped', () => {
		const parsed = analyzeRequestSchema.safeParse({ nodes: [{}], actionOptions: { titles: ['x'.repeat(5_000)] } });
		expect(parsed.success).toBe(true);
		expect(parsed.success && parsed.data.actionOptions).toBeUndefined();
	});

	it('accepts long document titles', () => {
		const parsed = analyzeRequestSchema.safeParse({ nodes: [{}], actionOptions: { titles: ['t'.repeat(250)] } });
		expect(parsed.success && parsed.data.actionOptions?.titles).toHaveLength(1);
	});
});
