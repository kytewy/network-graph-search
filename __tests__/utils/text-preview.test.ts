import { contentPreview } from '@/lib/utils/text-preview';

describe('contentPreview', () => {
	it('keeps short text as it is', () => {
		expect(contentPreview('  Short text  ', 120)).toBe('Short text');
	});

	it('cuts long text at a word near the limit', () => {
		expect(contentPreview('one two three four five six', 15)).toBe('one two three...');
	});

	it('says so when there is no text', () => {
		expect(contentPreview('', 120)).toBe('No content available');
	});
});
