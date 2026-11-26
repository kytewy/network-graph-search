/** The sidebar's pages. `soon` items show but don't link yet. */
export type NavItem = { label: string; href: string; icon: 'workstreams' | 'explore' | 'sources'; soon?: boolean };

export const NAV_ITEMS: readonly NavItem[] = [
	{ label: 'Workstreams', href: '/workstreams', icon: 'workstreams', soon: true },
	{ label: 'Explore', href: '/graph', icon: 'explore' },
	{ label: 'Sources', href: '/sources', icon: 'sources' },
];

/** Whether a nav item is the page being shown (its own path or one under it). */
export function isActive(item: NavItem, pathname: string): boolean {
	return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Remembers whether the sidebar is folded to icons. */
export const SIDEBAR_FOLDED_KEY = 'lantern:sidebar-folded';
