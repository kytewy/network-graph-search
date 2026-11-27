import { describe, expect, it } from 'vitest';
import { stretch } from '@/hooks/use-rubber-band';

describe('rubber-band stretch (Apple’s formula)', () => {
	it('matches b = (1 - 1/(x·0.55/d + 1))·d', () => {
		expect(stretch(100, 960)).toBeCloseTo(52.02, 1);
		expect(stretch(400, 960)).toBeCloseTo(178.98, 1);
	});

	it('pulls down past the top and up past the bottom', () => {
		expect(stretch(50, 700)).toBeGreaterThan(0);
		expect(stretch(-50, 700)).toBeLessThan(0);
	});

	it('gives less and less the further you pull, never more than the box', () => {
		expect(stretch(200, 700) - stretch(100, 700)).toBeLessThan(stretch(100, 700));
		expect(stretch(1e9, 700)).toBeLessThan(700);
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
		expect(list.style.transform).toMatch(/translateY\(\d+(\.\d+)?px\)/);
		detach();
		expect(list.style.transform).toBe('');
	});
});
