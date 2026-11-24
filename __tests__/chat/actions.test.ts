import { actionsInstruction, extractActions, type ActionOptions } from '@/lib/contracts/analysis';
import { actionOptionsFromStore, applyAction } from '@/lib/chat/actions';
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';
import type { Node } from '@/lib/config/types';

const options: ActionOptions = {
	continents: ['Europe', 'North America'],
	countries: ['Canada'],
	publishers: ['Regulator'],
	searches: [{ value: '1', query: 'AI regulation' }],
	colorModes: ['continent', 'publisher'],
	clusterModes: ['none', 'continent'],
	titles: ['EU AI Act', 'OSFI Guideline E-23'],
};
const block = (json: string) => `Here is the answer.\n\n\`\`\`actions\n${json}\n\`\`\``;

describe('extractActions', () => {
	it('splits the answer from valid suggestions', () => {
		const { text, actions } = extractActions(
			block('[{"type":"filter","filter":"continents","values":["Europe"],"label":"Filter to Europe"},{"type":"color","mode":"publisher","label":"Colour by publisher"}]'),
			options
		);
		expect(text).toBe('Here is the answer.');
		expect(actions.map((a) => a.label)).toEqual(['Filter to Europe', 'Colour by publisher']);
	});

	it('drops suggestions that name something unavailable or break the rules', () => {
		const { actions } = extractActions(
			block(
				'[{"type":"filter","filter":"continents","values":["Mars"],"label":"Mars"},{"type":"color","mode":"rainbow","label":"x"},{"type":"delete","label":"x"},{"type":"filter","filter":"tags","values":["a"],"label":"x"}]'
			),
			options
		);
		expect(actions).toEqual([]);
	});

	it('keeps at most 3, and copes with no block or broken JSON', () => {
		const four = Array.from({ length: 4 }, () => '{"type":"cluster","mode":"continent","label":"Group"}').join(',');
		expect(extractActions(block(`[${four}]`), options).actions).toHaveLength(3);
		expect(extractActions('Just an answer', options)).toEqual({ text: 'Just an answer', actions: [] });
		expect(extractActions(block('{oops'), options)).toEqual({ text: 'Here is the answer.', actions: [] });
	});

	it('tells the AI exactly which values it may use', () => {
		const text = actionsInstruction(options);
		expect(text).toContain('"Europe"');
		expect(text).toContain('"1" (AI regulation)');
	});
});

describe('applyAction', () => {
	const doc = (id: string, label: string, continent: string) => ({ id, label, continent, score: 0.8 }) as Node;
	beforeEach(() => {
		useAppStore.setState({ selectedContinents: [], colorMode: 'continent', rounds: [], aiClusters: {} });
		useAppStore.getState().setSearchResults([doc('eu', 'EU AI Act', 'Europe'), doc('ca', 'OSFI Guideline E-23', 'North America')]);
		useContextStore.setState({ contextNodes: [] });
	});

	it('filters, and undo puts the filter back', () => {
		const undo = applyAction({ type: 'filter', filter: 'continents', values: ['Europe'], label: 'Filter to Europe' });
		expect(useAppStore.getState().filteredResults.map((d) => d.id)).toEqual(['eu']);
		undo();
		expect(useAppStore.getState().filteredResults).toHaveLength(2);
	});

	it('changes the colour, and undo restores it', () => {
		const undo = applyAction({ type: 'color', mode: 'publisher', label: 'Colour by publisher' });
		expect(useAppStore.getState().colorMode).toBe('publisher');
		undo();
		expect(useAppStore.getState().colorMode).toBe('continent');
	});

	it('adds cited documents to context by title, and undo removes only those', () => {
		const undo = applyAction({ type: 'context', titles: ['OSFI Guideline E-23'], label: 'Add OSFI' });
		expect(useContextStore.getState().contextNodes.map((n) => n.id)).toEqual(['ca']);
		undo();
		expect(useContextStore.getState().contextNodes).toEqual([]);
	});

	it('offers only what exists: no search or AI-cluster options without them', () => {
		const o = actionOptionsFromStore();
		expect(o.continents).toEqual(['Europe', 'North America']);
		expect(o.searches).toEqual([]);
		expect(o.clusterModes).not.toContain('ai_clusters');
		expect(o.colorModes).not.toContain('search');
	});
});
