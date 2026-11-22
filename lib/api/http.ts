/** Shared pieces for talking to the app's own API routes. */

export class ApiError extends Error {
	constructor(message: string, readonly status?: number) {
		super(message);
		this.name = 'ApiError';
	}
}

/** Sends a request and returns its JSON, or throws the route's own error message. */
export async function requestJson<T>(url: string, init: RequestInit = {}, fallbackError = 'Request failed'): Promise<T> {
	const response = await fetch(url, {
		...init,
		headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
	});
	const data = await response.json().catch(() => null);
	if (!response.ok) {
		// API routes return { error }; older responses used { message }
		throw new ApiError(data?.error || data?.message || fallbackError, response.status);
	}
	return data as T;
}

export const RETRY = { COUNT: 1, DELAY_MS: 300 } as const;

/** Retry network blips and server errors once, never a request the server rejected. */
export function shouldRetry(failureCount: number, error: unknown) {
	if (failureCount >= RETRY.COUNT) return false;
	if (error instanceof ApiError) return (error.status ?? 0) >= 500;
	return true;
}

/** The same documents in any order make the same memory key. */
export const sortedIds = (items: readonly { id: string }[]) => items.map((n) => n.id).sort();
