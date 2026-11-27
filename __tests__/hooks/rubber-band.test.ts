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
