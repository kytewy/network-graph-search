import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { useViewInUrl } from '@/hooks/use-url-view';
import { cleanView } from '@/lib/url/view-params';
import { useAppStore } from '@/lib/stores/app-state';
import { useNetworkStore } from '@/lib/stores/network-store';

function setup(searchParams = '') {
	const updates: UrlUpdateEvent[] = [];
	const wrapper = withNuqsTestingAdapter({ searchParams, onUrlUpdate: (e) => updates.push(e) });
	renderHook(() => useViewInUrl(), { wrapper });
	return updates;
}

const reset = () => {
	useAppStore.setState({
		selectedContinents: [], selectedCountries: [], selectedPublishers: [], selectedTags: [],
		selectedSimilarityRanges: [], colorMode: 'continent', nodeSizeMode: 'none', clusterMode: 'none',
		searchResults: [], filteredResults: [],
	});
	useNetworkStore.setState({ layoutType: 'forceDirected2d' });
};

describe('cleanView', () => {
	it('drops values a link might contain that the app does not know', () => {
		const view = cleanView({
			continent: ['Europe', 'Atlantis'], country: ['Canada', 'Narnia'], publisher: ['Regulator', 'Wizard'],
			tag: ['risk'], similarity: ['81-100', '200-300'],
			color: 'publisher', size: 'none', cluster: 'none', layout: 'circular2d',
		});
		expect(view).toMatchObject({
			continent: ['Europe'], country: ['Canada'], publisher: ['Regulator'], tag: ['risk'], similarity: ['81-100'],
		});
	});
});

describe('filters and view settings in the web address', () => {
	beforeEach(reset);

	it('opens with the filters and view from the address', () => {
		setup('?continent=Europe,Asia&publisher=Regulator&color=publisher&layout=circular2d&size=similarity');
		const app = useAppStore.getState();
		expect(app.selectedContinents).toEqual(['Europe', 'Asia']);
		expect(app.selectedPublishers).toEqual(['Regulator']);
		expect(app.colorMode).toBe('publisher');
		expect(app.nodeSizeMode).toBe('similarity');
		expect(useNetworkStore.getState().layoutType).toBe('circular2d');
	});

	it('ignores an unknown setting in a link', () => {
		setup('?color=rainbow&layout=spiral');
		expect(useAppStore.getState().colorMode).toBe('continent');
		expect(useNetworkStore.getState().layoutType).toBe('forceDirected2d');
	});

	it('writes a changed filter or setting into the address without a new history entry', async () => {
		const updates = setup('');
		await act(async () => {
			useAppStore.getState().toggleContinent('Europe');
			useAppStore.getState().setColorMode('publisher');
		});
		await act(() => new Promise((r) => setTimeout(r, 100)));
		const last = updates.at(-1)!;
		expect(last.searchParams.get('continent')).toBe('Europe');
		expect(last.searchParams.get('color')).toBe('publisher');
		expect(last.options.history).toBe('replace');
	});

	it('leaves defaults out, so a plain view keeps a short address', async () => {
		const updates = setup('?color=publisher');
		await act(async () => useAppStore.getState().setColorMode('continent'));
		await act(() => new Promise((r) => setTimeout(r, 100)));
		expect(updates.at(-1)?.searchParams.has('color')).toBe(false);
	});
});
