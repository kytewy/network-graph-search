import { chatTitle, MAX_TITLE } from '@/lib/chat/chat-title';

describe('chatTitle: tidying the AI-written chat name', () => {
	it('drops quotes, a full stop and anything past the first line', () => {
		expect(chatTitle('"Binding AI rules in the EU."\nExtra')).toBe('Binding AI rules in the EU');
	});
	it('keeps names short', () => {
		expect(chatTitle('x'.repeat(100))).toHaveLength(MAX_TITLE);
	});
});
