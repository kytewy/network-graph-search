import { PostHog } from 'posthog-node';

export const POSTHOG_DEFAULT_HOST = 'https://us.i.posthog.com';

// undefined = not created yet; null = PostHog is off (no token)
let client: PostHog | null | undefined;

/**
 * Server PostHog client, or null when NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
 * isn't set, so local dev and tests send nothing.
 */
export function getPostHogServer(): PostHog | null {
	if (client !== undefined) return client;

	const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
	client = token
		? new PostHog(token, {
				host: process.env.NEXT_PUBLIC_POSTHOG_HOST || POSTHOG_DEFAULT_HOST,
				// Send each event right away: route handlers can end before a batch flushes
				flushAt: 1,
				flushInterval: 0,
			})
		: null;
	return client;
}

/** Report a server error to PostHog Error Tracking, if PostHog is on. */
export function captureServerError(error: unknown, properties: Record<string, unknown> = {}) {
	getPostHogServer()?.captureException(error, { properties });
}

/** Tests only: forget the client so env changes take effect. */
export function resetPostHogServer() {
	client = undefined;
}
