import { QueryClient } from '@tanstack/react-query';

/**
 * The app's one TanStack Query client: shared memory for server data.
 * The store uses it directly for searches, and QueryProvider hands it to
 * hooks. Only the browser runs queries, so one shared client is safe.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: { refetchOnWindowFocus: false },
	},
});
