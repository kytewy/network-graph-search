/**
 * `/` used to 404; a crash on the graph page showed a blank screen.
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

const redirect = vi.fn();
vi.mock('next/navigation', () => ({ redirect: (path: string) => redirect(path) }));

import Home from '@/app/page';
import GraphError from '@/app/(app)/graph/error';

describe('/', () => {
	it('sends visitors to the graph', () => {
		Home();
		expect(redirect).toHaveBeenCalledWith('/graph');
	});
});

describe('graph error page', () => {
	beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
	afterEach(() => vi.restoreAllMocks());

	it('shows a friendly message and retries', () => {
		const reset = vi.fn();
		render(<GraphError error={new Error('boom')} reset={reset} />);

		expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
		expect(screen.queryByText('boom')).toBeNull();
		fireEvent.click(screen.getByRole('button', { name: /try again/i }));
		expect(reset).toHaveBeenCalled();
	});

	it('offers a reload when part of the app failed to download', () => {
		const error = Object.assign(new Error('Loading chunk failed'), { name: 'ChunkLoadError' });
		render(<GraphError error={error} reset={vi.fn()} />);

		expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
		expect(screen.getByRole('alert')).toHaveTextContent(/reload/i);
	});
});
