import { HIGHLIGHT_COLOR, NODE_RING, nodeRingStyle } from '@/lib/config/graph-colors';

describe('nodeRingStyle', () => {
	it('is a thin grey ring for a document not in context', () => {
		expect(nodeRingStyle(false)).toEqual(NODE_RING.notInContext);
	});

	it('is a thicker black ring once the document is in context', () => {
		const ring = nodeRingStyle(true);
		expect(ring).toEqual(NODE_RING.inContext);
		expect(ring.strokeWidth).toBeGreaterThan(NODE_RING.notInContext.strokeWidth);
	});

	it('never uses the hover purple, so hover and "added" look different', () => {
		expect(nodeRingStyle(true).color).not.toBe(HIGHLIGHT_COLOR);
		expect(nodeRingStyle(false).color).not.toBe(HIGHLIGHT_COLOR);
	});
});
