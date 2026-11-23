import { renderHook } from '@testing-library/react';
import { useHasAiClusters } from '@/hooks/use-ai-clusters';
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

describe('AI clusters in the store', () => {
	const doc = (id: string) => ({ id, label: id, score: 1, size: 1, publisher: '', documentType: '', summary: '', content: '' }) as any;

	it('applying clusters stores them and switches the graph to cluster by them', () => {
		useAppStore.getState().applyAiClusters({ a: 'cluster_0' });
		expect(useAppStore.getState().aiClusters).toEqual({ a: 'cluster_0' });
		expect(useAppStore.getState().clusterMode).toBe('ai_clusters');
	});

	it('clearing removes them and turns clustering off', () => {
		useAppStore.getState().applyAiClusters({ a: 'cluster_0' });
		useAppStore.getState().clearAiClusters();
		expect(useAppStore.getState().aiClusters).toEqual({});
		expect(useAppStore.getState().clusterMode).toBe('none');
	});

	it('reports clusters only when a node on screen has one', () => {
		useAppStore.getState().applyAiClusters({ a: 'cluster_0' });
		useAppStore.setState({ filteredResults: [doc('b')] });
		expect(renderHook(() => useHasAiClusters()).result.current).toBe(false);
		useAppStore.setState({ filteredResults: [doc('a')] });
		expect(renderHook(() => useHasAiClusters()).result.current).toBe(true);
	});
});

describe('lasso in the store', () => {
	beforeEach(() => useAppStore.getState().closeLasso());

	it('tracks the nodes caught while dragging, without opening the menu', () => {
		useAppStore.getState().setLassoNodes(['a', 'b']);
		expect(useAppStore.getState().lassoNodes).toEqual(['a', 'b']);
		expect(useAppStore.getState().lassoMenuOpen).toBe(false);
	});

	it('opens the menu when a lasso ends with nodes in it', () => {
		useAppStore.getState().finishLasso(['a']);
		expect(useAppStore.getState().lassoMenuOpen).toBe(true);
	});

	it('an empty lasso clears instead', () => {
		useAppStore.getState().setLassoNodes(['a']);
		useAppStore.getState().finishLasso([]);
		expect(useAppStore.getState().lassoNodes).toEqual([]);
		expect(useAppStore.getState().lassoMenuOpen).toBe(false);
	});

	it('closing clears the lasso', () => {
		useAppStore.getState().finishLasso(['a']);
		useAppStore.getState().closeLasso();
		expect(useAppStore.getState()).toMatchObject({ lassoNodes: [], lassoMenuOpen: false });
	});
});

describe('wide panels', () => {
	it('opening the search panel folds the analysis workspace, and the other way round', () => {
		const s = useAppStore.getState();
		s.setRightPanelExpanded(true);
		s.setSearchPanelExpanded(true);
		expect(useAppStore.getState()).toMatchObject({ searchPanelExpanded: true, rightPanelExpanded: false });
		useAppStore.getState().setRightPanelExpanded(true);
		expect(useAppStore.getState()).toMatchObject({ searchPanelExpanded: false, rightPanelExpanded: true });
	});

	it('folding one leaves the other as it is', () => {
		useAppStore.getState().setRightPanelExpanded(true);
		useAppStore.getState().setSearchPanelExpanded(false);
		expect(useAppStore.getState().rightPanelExpanded).toBe(true);
	});
});
