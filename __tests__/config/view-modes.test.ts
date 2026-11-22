import {
	CLUSTER_MODES,
	COLOR_MODES,
	SIZE_MODES,
	colorLegend,
	colorOfNode,
	modeLabel,
} from '@/lib/config/view-modes';
import { UNKNOWN_COLOR, publisherColor } from '@/lib/config/document-taxonomy';

const node = (extra: Record<string, unknown>) => ({ id: 'a', label: 'A', score: 0.5, size: 1, ...extra }) as any;

describe('view mode registry', () => {
	it('lists each mode once, with a label', () => {
		for (const modes of [COLOR_MODES, SIZE_MODES, CLUSTER_MODES]) {
			const ids = modes.map((m) => m.id);
			expect(new Set(ids).size).toBe(ids.length);
			modes.forEach((m) => expect(m.label).toBeTruthy());
		}
	});

	it('colours a node the same way its legend says', () => {
		for (const mode of COLOR_MODES) {
			const legend = colorLegend(mode.id, [node({ continent: 'Europe', country: 'Canada', publisher: 'Regulator', documentType: 'Law', score: 0.9 })]);
			expect(legend.length).toBeGreaterThan(0);
		}
		expect(colorOfNode(node({ continent: 'Europe' }), 'continent')).toBe(
			colorLegend('continent', []).find((e) => e.label === 'Europe')?.color
		);
		expect(colorOfNode(node({ publisher: 'Regulator' }), 'publisher')).toBe(publisherColor('Regulator'));
	});

	it('spells European Union the way the data does (the legend had a typo)', () => {
		const eu = colorLegend('country', []).find((e) => e.label === 'European Union');
		expect(eu?.color).toBe(colorOfNode(node({ country: 'European Union' }), 'country'));
	});

	it('puts similarity scores in the same buckets as its legend', () => {
		const legend = colorLegend('similarityRange', []);
		expect(colorOfNode(node({ score: 0.95 }), 'similarityRange')).toBe(legend[0].color);
		expect(colorOfNode(node({ score: 0.05 }), 'similarityRange')).toBe(legend.at(-1)?.color);
	});

	it('uses the unknown colour for missing values', () => {
		expect(colorOfNode(node({}), 'continent')).toBe(UNKNOWN_COLOR);
	});

	it('finds labels by id', () => {
		expect(modeLabel(COLOR_MODES, 'documentType')).toBe('Document type');
		expect(modeLabel(COLOR_MODES, 'nope' as any)).toBe('');
	});
});
