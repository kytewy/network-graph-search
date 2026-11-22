import { useAppStore, PREFERENCES_STORAGE_KEY } from '@/lib/stores/app-state';

const saved = () => JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}').state ?? {};

describe('remembered preferences', () => {
	beforeEach(() => localStorage.clear());

	it('saves labels, the panel, the active-nodes toggle and the result count', () => {
		const s = useAppStore.getState();
		s.setShowLabels(false);
		s.setRightPanelExpanded(true);
		s.setShowActiveNodes(true);
		s.setTopK(20);
		expect(saved()).toEqual({ showLabels: false, rightPanelExpanded: true, showActiveNodes: true, topK: 20 });
	});

	it('never saves results, filters or the view modes the web address keeps', () => {
		useAppStore.getState().setColorMode('publisher');
		useAppStore.setState({ selectedContinents: ['Europe'], searchResults: [{ id: 'a' } as any] });
		const keys = Object.keys(saved());
		['colorMode', 'selectedContinents', 'searchResults', 'query'].forEach((k) => expect(keys).not.toContain(k));
	});

	it('brings saved preferences back on the next visit', async () => {
		localStorage.setItem(
			PREFERENCES_STORAGE_KEY,
			JSON.stringify({ state: { showLabels: false, topK: 30 }, version: 1 })
		);
		await useAppStore.persist.rehydrate();
		expect(useAppStore.getState()).toMatchObject({ showLabels: false, topK: 30 });
	});
});
