/**
 * Clustering, cluster names and the AI chat. Clustering and names are
 * remembered for the same set of documents, so re-running them is instant
 * and costs no AI call. Chat questions are never remembered.
 */
import { queryClient } from './query-client';
import { ApiError, RETRY, requestJson, shouldRetry, sortedIds } from './http';
import type { ClusterAnalysisResponse } from '@/lib/stores/context-store';
import type { AnalyzeRequest, ChatAction } from '@/lib/contracts/analysis';
import type { Receipt } from '@/lib/chat/receipt';
import type { ReadingEvent } from '@/lib/chat/read-document';

const REMEMBER_MS = 30 * 60_000;
const post = (body: unknown, signal?: AbortSignal): RequestInit => ({ method: 'POST', body: JSON.stringify(body), signal });

type ClusterInput = { id: string; label: string; content: string };
type NamingInput = { id: string; label: string; fields: { full_text: string } };

export function clusterDocuments(nodes: ClusterInput[]): Promise<ClusterAnalysisResponse> {
	return queryClient.fetchQuery({
		queryKey: ['clusters', sortedIds(nodes)],
		queryFn: ({ signal }) =>
			requestJson<ClusterAnalysisResponse>('/api/cluster-analysis', post({ nodes }, signal), 'Clustering failed'),
		staleTime: REMEMBER_MS,
		retry: shouldRetry,
		retryDelay: RETRY.DELAY_MS,
	});
}

export function nameCluster(clusterNodes: NamingInput[], clusterIndex: number) {
	return queryClient.fetchQuery({
		queryKey: ['cluster-name', clusterIndex, sortedIds(clusterNodes)],
		queryFn: ({ signal }) =>
			requestJson<Record<string, unknown>>('/api/analyze-cluster', post({ clusterNodes, clusterIndex }, signal)),
		staleTime: REMEMBER_MS,
		retry: shouldRetry,
		retryDelay: RETRY.DELAY_MS,
	});
}

/** Stop clustering and naming that are still running. */
export function cancelClustering() {
	queryClient.cancelQueries({ queryKey: ['clusters'] });
	queryClient.cancelQueries({ queryKey: ['cluster-name'] });
}

/** Ask the AI about the documents. Pass a signal so Stop really cancels the request. */
export function analyzeNodes({ signal, ...body }: AnalyzeRequest & { signal?: AbortSignal }) {
	return requestJson<{ summary: string; actions?: ChatAction[]; receipt?: Receipt }>('/api/analyze-nodes', post(body, signal), 'Analysis failed');
}

export type AnalysisAnswer = { summary: string; actions?: ChatAction[]; receipt?: Receipt };

/**
 * Ask the AI and hear, as it happens, each document it opens to read in
 * full. Resolves with the answer; Stop (the signal) cancels it.
 */
export async function analyzeNodesLive({
	signal,
	onRead,
	...body
}: AnalyzeRequest & { signal?: AbortSignal; onRead?: (event: ReadingEvent) => void }): Promise<AnalysisAnswer> {
	const response = await fetch('/api/analyze-nodes', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...body, stream: true }),
		signal,
	});
	// Turned down before any reading (bad request, rate limit): a plain JSON error
	if (!response.ok || !response.body) {
		const data = await response.json().catch(() => null);
		throw new ApiError(data?.error || 'Analysis failed', response.status);
	}
	// A plain reply (no live updates) is the whole answer at once
	if (!response.headers.get('Content-Type')?.includes('ndjson')) return (await response.json()) as AnalysisAnswer;
	const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
	let buffered = '';
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		buffered += value;
		const lines = buffered.split('\n');
		buffered = lines.pop() ?? '';
		for (const line of lines) {
			if (!line.trim()) continue;
			const event = JSON.parse(line);
			if (event.type === 'reading') onRead?.(event);
			else if (event.type === 'done') return { summary: event.summary, actions: event.actions, receipt: event.receipt };
			else if (event.type === 'error') throw new ApiError(event.message || 'Analysis failed', event.status ?? 500);
		}
	}
	throw new ApiError('The answer was cut off. Try again.', 502);
}

/** A short AI-written name for a new chat, from its first question and answer */
export function nameChat(question: string, answer: string) {
	return requestJson<{ title: string }>('/api/chat-title', post({ question, answer }), 'Could not name the chat');
}
