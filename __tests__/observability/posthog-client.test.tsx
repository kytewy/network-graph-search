/**
 * Browser-side error reporting: a no-op until PostHog has loaded,
 * and both error pages report what they caught.
 */

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

const mockPosthog = { __loaded: false, captureException: jest.fn() };
// Getter: jest hoists this mock above the const, so read it lazily
jest.mock('posthog-js', () => ({ __esModule: true, get default() { return mockPosthog; } }));
const posthog = mockPosthog;

import { captureClientError, reportError } from '@/lib/observability/capture-client';
import GraphError from '@/app/graph/error';
import GlobalError from '@/app/global-error';

beforeEach(() => {
	posthog.__loaded = false;
	posthog.captureException.mockClear();
	jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('captureClientError', () => {
	it('does nothing when PostHog is not set up', () => {
		captureClientError(new Error('boom'));
		expect(posthog.captureException).not.toHaveBeenCalled();
	});

	it('reports once PostHog has loaded', () => {
		posthog.__loaded = true;
		const error = new Error('boom');
		captureClientError(error, { boundary: 'graph' });
		expect(posthog.captureException).toHaveBeenCalledWith(error, { boundary: 'graph' });
	});
});

describe('error pages report what they caught', () => {
	it('graph error page', () => {
		posthog.__loaded = true;
		const error = new Error('graph crashed');
		render(<GraphError error={error} reset={jest.fn()} />);
		expect(posthog.captureException).toHaveBeenCalledWith(error, { boundary: 'graph' });
	});

	it('global error page renders a way out and reports', () => {
		posthog.__loaded = true;
		const error = new Error('layout crashed');
		// It renders its own <html>, so query what was rendered, not document.body
		const { getByRole } = render(<GlobalError error={error} />, { container: document.documentElement });
		expect(getByRole('button', { name: /reload/i })).toBeInTheDocument();
		expect(posthog.captureException).toHaveBeenCalledWith(error, { boundary: 'global' });
	});
});

describe('reportError (errors the UI catches itself)', () => {
	it('prints and reports with where it happened', () => {
		posthog.__loaded = true;
		const error = new Error('search failed');
		reportError('search', error, { query: 'AI' });

		expect(console.error).toHaveBeenCalledWith('[search]', error);
		expect(posthog.captureException).toHaveBeenCalledWith(error, { context: 'search', query: 'AI' });
	});

	it('ignores cancelled requests', () => {
		posthog.__loaded = true;
		reportError('search', Object.assign(new Error('aborted'), { name: 'AbortError' }));

		expect(console.error).not.toHaveBeenCalled();
		expect(posthog.captureException).not.toHaveBeenCalled();
	});
});
