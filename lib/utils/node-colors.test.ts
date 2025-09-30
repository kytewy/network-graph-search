/**
 * Tests for NodeColorCalculator
 * 
 * Run with: npm test node-colors.test.ts
 */

import { NodeColorCalculator } from './node-colors';
import type { Node } from '@/lib/stores/app-state';

// Helper to create mock nodes
const createMockNode = (overrides: Partial<Node> = {}): Node => ({
  id: 'test-1',
  label: 'Test Node',
  type: 'article',
  size: 10,
  color: '#000000',
  summary: 'Test summary',
  content: 'Test content',
  ...overrides,
} as Node);

describe('NodeColorCalculator', () => {
  describe('getColor - sourceType mode', () => {
    it('returns indigo for article type', () => {
      const node = createMockNode({ type: 'article' });
      expect(NodeColorCalculator.getColor(node, 'sourceType')).toBe('#4f46e5');
    });

    it('returns emerald for document type', () => {
      const node = createMockNode({ type: 'document' });
      expect(NodeColorCalculator.getColor(node, 'sourceType')).toBe('#10b981');
    });

    it('returns amber for webpage type', () => {
      const node = createMockNode({ type: 'webpage' });
      expect(NodeColorCalculator.getColor(node, 'sourceType')).toBe('#f59e0b');
    });

    it('returns red for pdf type', () => {
      const node = createMockNode({ type: 'pdf' });
      expect(NodeColorCalculator.getColor(node, 'sourceType')).toBe('#ef4444');
    });

    it('returns purple for unknown type', () => {
      const node = createMockNode({ type: 'unknown' });
      expect(NodeColorCalculator.getColor(node, 'sourceType')).toBe('#a855f7');
    });
  });

  describe('getColor - continent mode', () => {
    it('returns indigo for North America', () => {
      const node = createMockNode({ continent: 'North America' });
      expect(NodeColorCalculator.getColor(node, 'continent')).toBe('#4f46e5');
    });

    it('returns emerald for Europe', () => {
      const node = createMockNode({ continent: 'Europe' });
      expect(NodeColorCalculator.getColor(node, 'continent')).toBe('#10b981');
    });

    it('returns amber for Asia', () => {
      const node = createMockNode({ continent: 'Asia' });
      expect(NodeColorCalculator.getColor(node, 'continent')).toBe('#f59e0b');
    });

    it('returns red for Africa', () => {
      const node = createMockNode({ continent: 'Africa' });
      expect(NodeColorCalculator.getColor(node, 'continent')).toBe('#ef4444');
    });

    it('returns purple for South America', () => {
      const node = createMockNode({ continent: 'South America' });
      expect(NodeColorCalculator.getColor(node, 'continent')).toBe('#a855f7');
    });

    it('returns gray for unknown continent', () => {
      const node = createMockNode({ continent: undefined });
      expect(NodeColorCalculator.getColor(node, 'continent')).toBe('#6b7280');
    });
  });

  describe('getColor - country mode', () => {
    it('returns dark blue for USA', () => {
      const node = createMockNode({ country: 'USA' });
      expect(NodeColorCalculator.getColor(node, 'country')).toBe('#1e40af');
    });

    it('returns red for Canada', () => {
      const node = createMockNode({ country: 'Canada' });
      expect(NodeColorCalculator.getColor(node, 'country')).toBe('#ef4444');
    });

    it('returns light blue for European Union', () => {
      const node = createMockNode({ country: 'European Union' });
      expect(NodeColorCalculator.getColor(node, 'country')).toBe('#60a5fa');
    });

    it('returns gray for other countries', () => {
      const node = createMockNode({ country: 'Brazil' });
      expect(NodeColorCalculator.getColor(node, 'country')).toBe('#6b7280');
    });
  });

  describe('getColor - similarityRange mode', () => {
    it('returns bright green for 81-100% similarity', () => {
      const node = createMockNode({ score: 0.85 });
      expect(NodeColorCalculator.getColor(node, 'similarityRange')).toBe('#22c55e');
    });

    it('returns light green for 61-80% similarity', () => {
      const node = createMockNode({ score: 0.70 });
      expect(NodeColorCalculator.getColor(node, 'similarityRange')).toBe('#84cc16');
    });

    it('returns yellow for 41-60% similarity', () => {
      const node = createMockNode({ score: 0.50 });
      expect(NodeColorCalculator.getColor(node, 'similarityRange')).toBe('#eab308');
    });

    it('returns orange for 20-40% similarity', () => {
      const node = createMockNode({ score: 0.30 });
      expect(NodeColorCalculator.getColor(node, 'similarityRange')).toBe('#f97316');
    });

    it('returns bright red for <20% similarity', () => {
      const node = createMockNode({ score: 0.15 });
      expect(NodeColorCalculator.getColor(node, 'similarityRange')).toBe('#ef4444');
    });

    it('returns gray when score is undefined', () => {
      const node = createMockNode({ score: undefined });
      expect(NodeColorCalculator.getColor(node, 'similarityRange')).toBe('#6b7280');
    });

    it('handles edge case at 81%', () => {
      const node = createMockNode({ score: 0.81 });
      expect(NodeColorCalculator.getColor(node, 'similarityRange')).toBe('#22c55e');
    });

    it('handles edge case at 61%', () => {
      const node = createMockNode({ score: 0.61 });
      expect(NodeColorCalculator.getColor(node, 'similarityRange')).toBe('#84cc16');
    });
  });

  describe('getColor - documentType mode', () => {
    it('uses sourceType color logic', () => {
      const node = createMockNode({ type: 'article' });
      const sourceTypeColor = NodeColorCalculator.getColor(node, 'sourceType');
      const documentTypeColor = NodeColorCalculator.getColor(node, 'documentType');
      expect(documentTypeColor).toBe(sourceTypeColor);
    });
  });

  describe('getColorDescription', () => {
    it('returns type description for sourceType mode', () => {
      const node = createMockNode({ type: 'article' });
      const description = NodeColorCalculator.getColorDescription(node, 'sourceType');
      expect(description).toBe('Type: article');
    });

    it('returns continent description for continent mode', () => {
      const node = createMockNode({ continent: 'Europe' });
      const description = NodeColorCalculator.getColorDescription(node, 'continent');
      expect(description).toBe('Continent: Europe');
    });

    it('returns country description for country mode', () => {
      const node = createMockNode({ country: 'USA' });
      const description = NodeColorCalculator.getColorDescription(node, 'country');
      expect(description).toBe('Country: USA');
    });

    it('returns similarity percentage for similarityRange mode', () => {
      const node = createMockNode({ score: 0.75 });
      const description = NodeColorCalculator.getColorDescription(node, 'similarityRange');
      expect(description).toBe('Similarity: 75%');
    });

    it('handles missing data gracefully', () => {
      const node = createMockNode({ type: undefined, continent: undefined });
      expect(NodeColorCalculator.getColorDescription(node, 'sourceType')).toBe('Type: undefined');
      expect(NodeColorCalculator.getColorDescription(node, 'continent')).toBe('Continent: unknown');
    });
  });
});
