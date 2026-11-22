import { useAppStore } from '@/lib/stores/app-state';

describe('app store slices', () => {
	it('keeps view settings, including layout and panel toggles, in one store', () => {
		const s = useAppStore.getState();
		s.setLayoutType('circular2d');
		s.setColorMode('publisher');
		s.setShowActiveNodes(true);
		const after = useAppStore.getState();
		expect(after.layoutType).toBe('circular2d');
		expect(after.colorMode).toBe('publisher');
		expect(after.showActiveNodes).toBe(true);
	});

	it('keeps the hover highlight in the selection slice', () => {
		useAppStore.getState().setHighlightedNodes(['a']);
		expect(useAppStore.getState().highlightedNodes).toEqual(['a']);
	});

	it('changing a view setting leaves search results alone', () => {
		const results = useAppStore.getState().searchResults;
		useAppStore.getState().setNodeSizeMode('similarity');
		expect(useAppStore.getState().searchResults).toBe(results);
	});
});
