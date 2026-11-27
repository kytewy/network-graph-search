import { describe, expect, it, vi } from 'vitest';
import { attachScrollActivity } from '@/hooks/use-scroll-activity';

describe('attachScrollActivity', () => {
	it('marks the box while it scrolls, then clears the mark', () => {
		vi.useFakeTimers();
		const box = document.createElement('div');
		const detach = attachScrollActivity(box);
		box.dispatchEvent(new Event('scroll'));
		expect(box.dataset.scrolling).toBe('');
		vi.advanceTimersByTime(1000);
		expect(box.dataset.scrolling).toBeUndefined();
		detach();
		vi.useRealTimers();
	});
});
