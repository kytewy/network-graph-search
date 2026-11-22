import { useAppStore } from '@/lib/stores/app-state';
import { hasClustersFor } from '@/lib/clustering/assignments';

/** True when at least one document on the graph has an AI cluster. */
export function useHasAiClusters(): boolean {
	return useAppStore((s) => hasClustersFor(s.filteredResults, s.aiClusters));
}
