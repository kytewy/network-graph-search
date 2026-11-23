import { fireEvent, render, screen } from '@testing-library/react';
import { SearchError, friendlySearchError } from '@/components/search/SearchError';
import { useAppStore } from '@/lib/stores/app-state';

describe('SearchError', () => {
	const performSearch = vi.fn();
	beforeEach(() => {
		performSearch.mockReset();
		useAppStore.setState({ performSearch, query: 'AI regulation', topK: 20, error: null, isLoading: false });
	});

	it('shows nothing while there is no error', () => {
		const { container } = render(<SearchError />);
		expect(container).toBeEmptyDOMElement();
	});

	it('shows the error as an alert', () => {
		useAppStore.setState({ error: 'Too many requests' });
		render(<SearchError />);
		expect(screen.getByRole('alert')).toHaveTextContent('Too many requests');
	});

	it('Try again re-runs the same search', () => {
		useAppStore.setState({ error: 'Search failed' });
		render(<SearchError />);
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		expect(performSearch).toHaveBeenCalledWith('AI regulation', 20);
	});

	it('the close button dismisses it', () => {
		useAppStore.setState({ error: 'Search failed' });
		render(<SearchError />);
		fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(useAppStore.getState().error).toBeNull();
	});
});

describe('friendlySearchError', () => {
	it('explains a lost connection in plain words', () => {
		expect(friendlySearchError('Failed to fetch')).toMatch(/Couldn’t reach the search service/);
		expect(friendlySearchError('NetworkError when attempting to fetch resource.')).toMatch(/Couldn’t reach/);
	});

	it('keeps the server’s own message otherwise', () => {
		expect(friendlySearchError('Too many requests')).toBe('Too many requests');
	});
});
