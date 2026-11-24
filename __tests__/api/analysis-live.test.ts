/**
 * @vitest-environment node
 */
import { analyzeNodesLive } from '@/lib/api/analysis-client';
import { ApiError } from '@/lib/api/http';

const streamOf = (chunks: string[]) =>
	new Response(new ReadableStream({ start(c) { chunks.forEach((x) => c.enqueue(new TextEncoder().encode(x))); c.close(); } }), {
		headers: { 'Content-Type': 'application/x-ndjson' },
	});

describe('analyzeNodesLive: hearing the AI read', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('reports each document as it is read, even when a line arrives in pieces, then answers', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamOf([
			'{"type":"reading","id":"a","title":"OSFI E-23","round":1}\n{"type":"rea',
			'ding","id":"b","title":"Article 6","round":2}\n',
			'{"type":"done","summary":"Done.","actions":[]}\n',
		])));
		const seen: string[] = [];
		const answer = await analyzeNodesLive({ nodes: [{}], onRead: (e) => seen.push(`${e.round}:${e.title}`) });
		expect(seen).toEqual(['1:OSFI E-23', '2:Article 6']);
		expect(answer.summary).toBe('Done.');
	});

	it('throws the error a stream ends with, and accepts a plain JSON reply', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamOf(['{"type":"error","message":"The AI took too long","status":504}\n'])));
		await expect(analyzeNodesLive({ nodes: [{}] })).rejects.toEqual(new ApiError('The AI took too long', 504));
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ summary: 'Plain.' })));
		expect((await analyzeNodesLive({ nodes: [{}] })).summary).toBe('Plain.');
	});
});
