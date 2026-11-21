/**
 * Keeps only the latest request alive: starting a new one cancels the
 * previous one, so a slow old response can't overwrite a newer one.
 */
export function createLatestRequest() {
	let controller: AbortController | null = null;

	return {
		/** Cancel the previous request and return a signal for the new one. */
		next(): AbortSignal {
			controller?.abort();
			controller = new AbortController();
			return controller.signal;
		},
		/** Cancel the current request, if any. */
		cancel() {
			controller?.abort();
			controller = null;
		},
	};
}

/** True when an error only means the request was cancelled on purpose. */
export function isAbortError(error: unknown): boolean {
	return (error as { name?: string } | null)?.name === 'AbortError';
}
