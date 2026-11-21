import posthog from 'posthog-js';

// Runs in the browser before the app starts. PostHog stays off unless a
// project token is set, so local dev without a key sends nothing.
const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token) {
	posthog.init(token, {
		api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
		// Pinned snapshot of PostHog's recommended settings (page views included)
		defaults: '2026-08-30',
		// Report unhandled browser errors to Error Tracking
		capture_exceptions: true,
	});
}
