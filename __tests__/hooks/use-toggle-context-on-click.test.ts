import { act, renderHook } from '@testing-library/react';
import type { GraphNode } from 'reagraph';
import { useToggleContextOnClick } from '@/hooks/use-toggle-context-on-click';
import { useContextStore } from '@/lib/stores/context-store';

const doc = { id: 'doc1', label: 'OSFI guideline', summary: 'About AI risk' };
const graphNode = { id: 'doc1', data: { ...doc, ai_clusters: 'cluster_0' } } as unknown as GraphNode;

describe('useToggleContextOnClick', () => {
	beforeEach(() => useContextStore.setState({ contextNodes: [] }));

	it('adds the document on the first click and removes it on the second', () => {
		const { result } = renderHook(() => useToggleContextOnClick());

		act(() => result.current(graphNode));
		expect(useContextStore.getState().contextNodes.map((n) => n.id)).toEqual(['doc1']);

		act(() => result.current(graphNode));
		expect(useContextStore.getState().contextNodes).toEqual([]);
	});

	it('adds the document itself, without graph-only fields', () => {
		const { result } = renderHook(() => useToggleContextOnClick());
		act(() => result.current(graphNode));
		expect(useContextStore.getState().contextNodes[0]).not.toHaveProperty('ai_clusters');
		expect(useContextStore.getState().contextNodes[0]).toMatchObject(doc);
	});

	it('ignores a node with no document behind it', () => {
		const { result } = renderHook(() => useToggleContextOnClick());
		act(() => result.current({ id: 'x' } as GraphNode));
		expect(useContextStore.getState().contextNodes).toEqual([]);
	});
});
