import { describe, expect, it, vi } from 'vitest';
import { widenOnDoubleClick } from '@/components/layout/PanelChrome';

describe('widenOnDoubleClick', () => {
	it('toggles on double-click and says which way it goes', () => {
		const toggle = vi.fn();
		const narrow = widenOnDoubleClick(false, toggle);
		expect(narrow.title).toBe('Double-click to widen');
		narrow.onDoubleClick();
		expect(toggle).toHaveBeenCalledOnce();
		expect(widenOnDoubleClick(true, toggle).title).toBe('Double-click to narrow');
	});
});
