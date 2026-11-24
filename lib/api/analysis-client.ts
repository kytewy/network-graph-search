/**
 * Clustering, cluster names and the AI chat. Clustering and names are
 * remembered for the same set of documents, so re-running them is instant
 * and costs no AI call. Chat questions are never remembered.
 */
import { queryClient } from './query-client';
import { RETRY, requestJson, shouldRetry, sortedIds } from './http';
import type { ClusterAnalysisResponse } from '@/lib/stores/context-store';
import type { AnalyzeRequest, ChatAction } from '@/lib/contracts/analysis';

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
	return requestJson<{ summary: string; actions?: ChatAction[] }>('/api/analyze-nodes', post(body, signal), 'Analysis failed');
}
