import type { Instrumentation } from 'next';

// Next.js builds this file for both the Node.js and edge runtimes and
// replaces NEXT_RUNTIME with a constant in each build. Keeping the imports
// inside `if (... === 'nodejs')` lets the edge build drop them entirely, so
// posthog-node and the OpenTelemetry SDK (Node.js only) never reach it.

/** Runs once when the server starts: turns on PostHog logs if a token is set. */
export async function register() {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
		if (!token) return;

		const { createPostHogLogger, log, setLogger } = await import('./lib/observability/logger');
		setLogger(createPostHogLogger({ token, host: process.env.NEXT_PUBLIC_POSTHOG_HOST || undefined }));
		// One log per start, so a working setup shows up in PostHog right away
		log.info('Server started', { nodeEnv: process.env.NODE_ENV });
	}
}

/**
 * Next.js calls this for errors that escape server components, route
 * handlers and middleware. Errors our routes catch themselves are
 * reported by serverError() in lib/utils/api-guard.ts.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		const { captureServerError } = await import('./lib/observability/posthog-server');
		captureServerError(error, {
			path: request.path,
			method: request.method,
			routePath: context.routePath,
			routeType: context.routeType,
		});
	}
};
