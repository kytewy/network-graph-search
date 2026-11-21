/**
 * Reagraph re-runs the whole layout whenever the layoutOverrides object
 * changes identity. It must stay the same object across re-renders (e.g. a
 * hover highlight), and change only when its values do.
 */

import { renderHook } from '@testing-library/react';
import { useLayoutOverrides } from '@/hooks/use-layout-overrides';
import { GRAPH_LAYOUT_CONFIG } from '@/lib/config/graph-config';

describe('useLayoutOverrides', () => {
	it('returns the same object across re-renders', () => {
		const { result, rerender } = renderHook(({ clustered }) => useLayoutOverrides(clustered), {
			initialProps: { clustered: false },
		});
		const first = result.current;
		rerender({ clustered: false });
		rerender({ clustered: false });
		expect(result.current).toBe(first);
	});

	it('changes only when clustering is switched on or off', () => {
		const { result, rerender } = renderHook(({ clustered }) => useLayoutOverrides(clustered), {
			initialProps: { clustered: false },
		});
		expect(result.current.clusterStrength).toBe(0);
		rerender({ clustered: true });
		expect(result.current.clusterStrength).toBe(GRAPH_LAYOUT_CONFIG.clusterStrength);
		expect(result.current).toEqual({
			clusterStrength: GRAPH_LAYOUT_CONFIG.clusterStrength,
			linkDistance: GRAPH_LAYOUT_CONFIG.linkDistance,
			nodeStrength: GRAPH_LAYOUT_CONFIG.nodeStrength,
		});
	});
});
