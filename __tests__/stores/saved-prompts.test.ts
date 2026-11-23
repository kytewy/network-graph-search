import { cleanPrompt, MAX_PROMPT_NAME, STARTER_PROMPTS, useSavedPrompts } from '@/lib/stores/saved-prompts';

beforeEach(() => useSavedPrompts.setState({ prompts: STARTER_PROMPTS }));
const names = () => useSavedPrompts.getState().prompts.map((p) => p.name);

describe('saved prompts', () => {
	it('starts with the three prompts the chat used to have', () => {
		expect(names()).toEqual(['Summary', 'Business impact', 'Citations']);
	});

	it('adds, edits and removes a prompt', () => {
		const { addPrompt, updatePrompt, removePrompt } = useSavedPrompts.getState();
		const id = addPrompt('  Compare to OSFI  ', ' How do these compare to OSFI E-23? ')!;
		expect(useSavedPrompts.getState().prompts.at(-1)).toEqual({ id, name: 'Compare to OSFI', text: 'How do these compare to OSFI E-23?' });

		expect(updatePrompt(id, 'Compare', 'Shorter')).toBe(true);
		expect(useSavedPrompts.getState().prompts.at(-1)).toMatchObject({ name: 'Compare', text: 'Shorter' });

		removePrompt(id);
		expect(names()).toHaveLength(3);
	});

	it('refuses an empty name or text, and keeps names short', () => {
		const { addPrompt, updatePrompt } = useSavedPrompts.getState();
		expect(addPrompt('', 'text')).toBeNull();
		expect(addPrompt('name', '   ')).toBeNull();
		expect(updatePrompt('summary', 'Summary', '')).toBe(false);
		expect(cleanPrompt('x'.repeat(100), 'text')!.name).toHaveLength(MAX_PROMPT_NAME);
	});
});
