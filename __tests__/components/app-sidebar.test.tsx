import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

let pathname = '/graph';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

import { AppSidebar } from '@/components/shell/AppSidebar';
import { SIDEBAR_FOLDED_KEY, isActive, NAV_ITEMS } from '@/components/shell/nav';

describe('AppSidebar', () => {
	beforeEach(() => {
		localStorage.clear();
		pathname = '/graph';
	});

	it('shows the wordmark and marks Explore as the current page', () => {
		render(<AppSidebar />);
		expect(screen.getByText('Lantern')).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Explore' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('link', { name: 'Sources' }).getAttribute('aria-current')).toBeNull();
	});

	it('shows Workstreams as coming soon, not as a link', () => {
		render(<AppSidebar />);
		expect(screen.queryByRole('link', { name: /Workstreams/ })).toBeNull();
		expect(screen.getByText('Soon')).toBeTruthy();
	});

	it('folds to icons and remembers it', () => {
		render(<AppSidebar />);
		fireEvent.click(screen.getByRole('button', { name: 'Fold sidebar' }));
		expect(screen.queryByText('Lantern')).toBeNull();
		expect(localStorage.getItem(SIDEBAR_FOLDED_KEY)).toBe('1');
		expect(screen.getByRole('button', { name: 'Open sidebar' })).toBeTruthy();
	});

	it('treats pages under a section as that section', () => {
		const sources = NAV_ITEMS.find((i) => i.href === '/sources')!;
		expect(isActive(sources, '/sources/abc')).toBe(true);
		expect(isActive(sources, '/sourcesx')).toBe(false);
	});
});
