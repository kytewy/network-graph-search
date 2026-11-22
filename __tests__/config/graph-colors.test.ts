import { HIGHLIGHT_COLOR, NODE_RING, nodeFill, nodeRingStyle, purpleNodeIds } from '@/lib/config/graph-colors';

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

describe('nodeFill', () => {
	it('is purple only while hovered', () => {
		expect(nodeFill(true, '#ff0000', '#999999')).toBe(HIGHLIGHT_COLOR);
	});

	it('otherwise keeps the node’s own colour, or the default when it has none', () => {
		expect(nodeFill(false, '#ff0000', '#999999')).toBe('#ff0000');
		expect(nodeFill(false, undefined, '#999999')).toBe('#999999');
	});
});

describe('purpleNodeIds', () => {
	it('includes hovered nodes and the nodes caught in a lasso', () => {
		expect([...purpleNodeIds(['a'], ['b', 'c'])].sort()).toEqual(['a', 'b', 'c']);
	});

	it('keeps lassoed nodes purple while nothing is hovered', () => {
		expect([...purpleNodeIds([], ['b'])]).toEqual(['b']);
	});
});
