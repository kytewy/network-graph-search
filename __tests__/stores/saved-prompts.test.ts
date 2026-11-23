import { cleanPrompt, matchPrompts, MAX_PROMPT_NAME, recentPrompts, STARTER_PROMPTS, useSavedPrompts } from '@/lib/stores/saved-prompts';

beforeEach(() => useSavedPrompts.setState({ prompts: STARTER_PROMPTS }));
const names = () => useSavedPrompts.getState().prompts.map((p) => p.name);

describe('saved prompts', () => {
	it('starts with the three prompts the chat used to have', () => {
		expect(names()).toEqual(['Summary', 'Business impact', 'Citations']);
	});

	it('adds, edits and removes a prompt', () => {
		const { addPrompt, updatePrompt, removePrompt } = useSavedPrompts.getState();
		const id = addPrompt('  Compare to OSFI  ', ' How do these compare to OSFI E-23? ')!;
		expect(useSavedPrompts.getState().prompts.at(-1)).toMatchObject({ id, name: 'Compare to OSFI', text: 'How do these compare to OSFI E-23?' });

		expect(updatePrompt(id, 'Compare', 'Shorter')).toBe(true);
		expect(useSavedPrompts.getState().prompts.at(-1)).toMatchObject({ name: 'Compare', text: 'Shorter' });

		removePrompt(id);
		expect(names()).toHaveLength(3);
	});

	it('duplicates a prompt just below the original', () => {
		const copyId = useSavedPrompts.getState().duplicatePrompt('summary')!;
		expect(names()).toEqual(['Summary', 'Summary (copy)', 'Business impact', 'Citations']);
		const [original, copy] = useSavedPrompts.getState().prompts;
		expect(copy).toEqual({ id: copyId, name: 'Summary (copy)', text: original.text });
		expect(useSavedPrompts.getState().duplicatePrompt('missing')).toBeNull();
	});

	it('chips show the most recently used or saved prompts first', () => {
		const { addPrompt, touchPrompt } = useSavedPrompts.getState();
		const chips = () => recentPrompts(useSavedPrompts.getState().prompts, 3).map((p) => p.name);
		expect(chips()).toEqual(['Summary', 'Business impact', 'Citations']);
		vi.useFakeTimers();
		vi.setSystemTime(1000);
		addPrompt('Penalties', 'Which mention penalties?');
		expect(chips()).toEqual(['Penalties', 'Summary', 'Business impact']);
		vi.setSystemTime(2000);
		touchPrompt('citations');
		expect(chips()).toEqual(['Citations', 'Penalties', 'Summary']);
		vi.useRealTimers();
	});

	it('"/" menu: names that match first, then prompts whose text matches', () => {
		const prompts = useSavedPrompts.getState().prompts;
		expect(matchPrompts(prompts, '').map((p) => p.name)).toEqual(['Summary', 'Business impact', 'Citations']);
		expect(matchPrompts(prompts, 'IMPACT').map((p) => p.name)).toEqual(['Business impact']);
		// "summary" is Summary's name and appears in other prompts' text
		expect(matchPrompts(prompts, 'summary')[0].name).toBe('Summary');
		expect(matchPrompts(prompts, 'zzz')).toEqual([]);
	});

	it('refuses an empty name or text, and keeps names short', () => {
		const { addPrompt, updatePrompt } = useSavedPrompts.getState();
		expect(addPrompt('', 'text')).toBeNull();
		expect(addPrompt('name', '   ')).toBeNull();
		expect(updatePrompt('summary', 'Summary', '')).toBe(false);
		expect(cleanPrompt('x'.repeat(100), 'text')!.name).toHaveLength(MAX_PROMPT_NAME);
	});
});
