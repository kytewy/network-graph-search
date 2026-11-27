import { describe, expect, it } from 'vitest';
import { RUBBER_BAND, stretch } from '@/hooks/use-rubber-band';

describe('rubber-band stretch', () => {
	it('pulls the list down past the top and up past the bottom', () => {
		expect(stretch(0, -40)).toBeGreaterThan(0);
		expect(stretch(0, 40)).toBeLessThan(0);
	});

	it('gets stiffer the further it goes, and never past the limit', () => {
		const first = stretch(0, -40);
		const later = stretch(40, -40) - 40;
		expect(later).toBeLessThan(first);
		let offset = 0;
		for (let i = 0; i < 100; i++) offset = stretch(offset, -400);
		expect(offset).toBeLessThanOrEqual(RUBBER_BAND.maxPx);
	});
});

describe('attachRubberBand', () => {
	it('stretches the list when you scroll past the top, and lets go when taken off', async () => {
		const { attachRubberBand } = await import('@/hooks/use-rubber-band');
		const box = document.createElement('div');
		const list = document.createElement('div');
		box.appendChild(list);
		const detach = attachRubberBand(box);
		box.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }));
		expect(list.style.transform).toMatch(/translateY\(2\d(\.\d+)?px\)/);
		detach();
		expect(list.style.transform).toBe('');
	});
});
