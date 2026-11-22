/**
 * Hovering a document anywhere in the side panels highlights its node
 * on the graph (reagraph `actives`), via the network store.
 */

import { act, renderHook } from '@testing-library/react';
import { useHighlightOnHover } from '@/hooks/use-highlight-on-hover';
import { useAppStore } from '@/lib/stores/app-state';

const highlighted = () => useAppStore.getState().highlightedNodes;

beforeEach(() => useAppStore.setState({ highlightedNodes: [] }));

describe('useHighlightOnHover', () => {
	it('highlights on hover and clears on leave', () => {
		const { result } = renderHook(() => useHighlightOnHover());
		act(() => result.current('A50').onMouseEnter());
		expect(highlighted()).toEqual(['A50']);
		act(() => result.current('A50').onMouseLeave());
		expect(highlighted()).toEqual([]);
	});

	it('works with the keyboard too', () => {
		const { result } = renderHook(() => useHighlightOnHover());
		act(() => result.current('R1').onFocus());
		expect(highlighted()).toEqual(['R1']);
		act(() => result.current('R1').onBlur());
		expect(highlighted()).toEqual([]);
	});

	it('clears its highlight when the list goes away', () => {
		const { result, unmount } = renderHook(() => useHighlightOnHover());
		act(() => result.current('A50').onMouseEnter());
		unmount();
		expect(highlighted()).toEqual([]);
	});

	it('leaves someone else’s highlight alone on unmount', () => {
		const { unmount } = renderHook(() => useHighlightOnHover());
		act(() => useAppStore.getState().setHighlightedNodes(['X']));
		unmount();
		expect(highlighted()).toEqual(['X']);
	});
});
