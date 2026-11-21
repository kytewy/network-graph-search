/**
 * Browser-side error reporting: a no-op until PostHog has loaded,
 * and both error pages report what they caught.
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

const posthog = { __loaded: false, captureException: jest.fn() };
jest.mock('posthog-js', () => ({ __esModule: true, default: posthog }));

import { captureClientError } from '@/lib/observability/capture-client';
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
		render(<GlobalError error={error} />, { container: document.documentElement });
		expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
		expect(posthog.captureException).toHaveBeenCalledWith(error, { boundary: 'global' });
	});
});
