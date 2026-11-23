'use client';

import { AlertCircle, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/stores/app-state';

/** The browser's wording for "no connection" differs; say it plainly instead. */
export function friendlySearchError(message: string): string {
	if (/failed to fetch|networkerror|load failed/i.test(message)) {
		return 'Couldn’t reach the search service. Check your connection and try again.';
	}
	return message;
}

/**
 * Shows why the last search failed, under the search box, with a way to
 * try again. A new search clears it (performSearch resets the error).
 */
export function SearchError() {
	const error = useAppStore((s) => s.error);
	const isLoading = useAppStore((s) => s.isLoading);
	if (!error) return null;

	const retry = () => {
		const { query, topK, performSearch } = useAppStore.getState();
		performSearch(query, topK);
	};

	return (
		<div
			role="alert"
			className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
			<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
			<div className="flex-1">
				<p className="font-medium">Search failed</p>
				<p className="text-destructive/90">{friendlySearchError(error)}</p>
				<Button variant="outline" size="sm" className="mt-2 h-7" onClick={retry} disabled={isLoading}>
					<RotateCw className="mr-1 h-3 w-3" aria-hidden="true" />
					Try again
				</Button>
			</div>
			<button
				type="button"
				aria-label="Dismiss"
				onClick={() => useAppStore.getState().setError(null)}
				className="rounded p-0.5 hover:bg-destructive/10">
				<X className="h-4 w-4" aria-hidden="true" />
			</button>
		</div>
	);
}
