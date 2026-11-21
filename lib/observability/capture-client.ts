import posthog from 'posthog-js';
import { isAbortError } from '@/lib/utils/latest-request';

/**
 * Report a browser error to PostHog Error Tracking. Does nothing until
 * instrumentation-client.ts has initialised PostHog (no token = off).
 */
export function captureClientError(error: unknown, properties?: Record<string, unknown>) {
	if (posthog.__loaded) posthog.captureException(error, properties);
}

/**
 * For errors the UI catches and handles itself (a failed search, a failed
 * clustering run): print to the console and report to PostHog, since
 * caught errors are never captured automatically. Cancelled requests are
 * skipped: they're on purpose, not failures.
 */
export function reportError(context: string, error: unknown, properties?: Record<string, unknown>) {
	if (isAbortError(error)) return;
	console.error(`[${context}]`, error);
	captureClientError(error, { context, ...properties });
}
