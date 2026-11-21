import posthog from 'posthog-js';

/**
 * Report a browser error to PostHog Error Tracking. Does nothing until
 * instrumentation-client.ts has initialised PostHog (no token = off).
 */
export function captureClientError(error: unknown, properties?: Record<string, unknown>) {
	if (posthog.__loaded) posthog.captureException(error, properties);
}
