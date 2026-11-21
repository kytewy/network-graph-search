import type { Instrumentation } from 'next';

/** Runs once when the server starts: turns on PostHog logs if a token is set. */
export async function register() {
	const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
	// The OpenTelemetry SDK needs Node.js APIs; skip the edge runtime
	if (process.env.NEXT_RUNTIME !== 'nodejs' || !token) return;

	const { createPostHogLogger, setLogger } = await import('./lib/observability/logger');
	setLogger(createPostHogLogger({ token, host: process.env.NEXT_PUBLIC_POSTHOG_HOST || undefined }));
}

/**
 * Next.js calls this for errors that escape server components, route
 * handlers and middleware. Errors our routes catch themselves are
 * reported by serverError() in lib/utils/api-guard.ts.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
	// posthog-node needs Node.js APIs; skip the edge runtime
	if (process.env.NEXT_RUNTIME !== 'nodejs') return;

	const { captureServerError } = await import('./lib/observability/posthog-server');
	captureServerError(error, {
		path: request.path,
		method: request.method,
		routePath: context.routePath,
		routeType: context.routeType,
	});
};
