'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileText, Layers, Network, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { LanternMark } from './LanternMark';
import { PANEL_BUTTON, PANEL_MOTION } from '@/components/layout/PanelChrome';
import { NAV_ITEMS, SIDEBAR_FOLDED_KEY, isActive, type NavItem } from './nav';

const ICONS: Record<NavItem['icon'], typeof Layers> = { workstreams: Layers, explore: Network, sources: FileText };

/** Lantern's left sidebar: the wordmark and the main pages. Folds to icons to give the graph room. */
export function AppSidebar() {
	const pathname = usePathname() ?? '';
	const [folded, setFolded] = useState(false);

	// The saved choice, read after mount; storage can be missing or blocked
	useEffect(() => {
		try { setFolded(localStorage.getItem(SIDEBAR_FOLDED_KEY) === '1'); } catch {}
	}, []);

	function toggle() {
		setFolded(!folded);
		try { localStorage.setItem(SIDEBAR_FOLDED_KEY, folded ? '0' : '1'); } catch {}
	}

	return (
		<nav
			aria-label="Main"
			data-folded={folded}
			className={`${folded ? 'w-14' : 'w-58'} shrink-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col gap-0.5 px-2 pb-3 ${PANEL_MOTION}`}>
			{/* Same 48px header row and divider as the panels, so the fold buttons line up */}
			<div className={`-mx-2 mb-2 h-12 shrink-0 border-b border-sidebar-border flex items-center px-2 ${folded ? 'justify-center' : 'justify-between pl-4'}`}>
				{!folded && (
					<Link href="/graph" className="flex items-center gap-2 text-[15px] font-semibold">
						<LanternMark />
						Lantern
					</Link>
				)}
				<button
					type="button"
					onClick={toggle}
					aria-label={folded ? 'Open sidebar' : 'Fold sidebar'}
					className={PANEL_BUTTON}>
					{folded ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
				</button>
			</div>
			{NAV_ITEMS.map((item) => {
				const Icon = ICONS[item.icon];
				const base = `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${folded ? 'justify-center' : ''}`;
				if (item.soon) {
					return (
						<span key={item.href} aria-disabled="true" title={`${item.label} · coming soon`} className={`${base} text-muted-foreground/70 cursor-default`}>
							<Icon className="size-4 shrink-0" aria-hidden="true" />
							{!folded && (
								<>
									<span className="flex-1">{item.label}</span>
									<span className="text-[11px]">Soon</span>
								</>
							)}
						</span>
					);
				}
				const active = isActive(item, pathname);
				return (
					<Link
						key={item.href}
						href={item.href}
						aria-current={active ? 'page' : undefined}
						title={folded ? item.label : undefined}
						className={`${base} ${active ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}>
						<Icon className="size-4 shrink-0" aria-hidden="true" />
						{!folded && item.label}
					</Link>
				);
			})}
		</nav>
	);
}
