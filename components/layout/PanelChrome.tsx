'use client';

import type { ReactNode } from 'react';
import { Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

/**
 * The pieces both side panels share, so they line up: one header height, and
 * the thin rail a panel folds into when it's closed.
 */

/** Every side panel's top bar: same height and divider on both sides */
export const PANEL_HEADER = 'h-12 shrink-0 border-b border-sidebar-border flex items-center gap-2 px-2';

/** The small ghost buttons in a panel header (fold) */
export const PANEL_BUTTON =
	'h-7 min-w-7 px-1.5 rounded-md flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-accent/50';

/** A tab in a panel header: underlined when active, the same on both sides */
export const PANEL_TAB =
	'flex items-center gap-2 rounded-t-md rounded-b-none border-0 border-b-2 border-transparent shadow-none data-[state=active]:shadow-none pb-2 pt-2 px-4 font-normal text-muted-foreground transition-all duration-200 data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-transparent hover:text-foreground hover:bg-accent/50';

/**
 * Panel widths, written out in full so Tailwind finds them. The analysis panel
 * is a little wider so its three tabs fit. A wide panel stops at the other
 * panel's edge (or its 40px rail).
 */
export const PANEL_WIDTH = { left: 'w-96', right: 'w-[26rem]' } as const;
/**
 * A maximized panel covers the graph, from its own edge to the other panel's (or that panel's
 * 40px rail when it's folded). Written out in full so Tailwind finds them.
 */
export const WIDE_STOPS_AT = {
	left: { open: 'right-[26rem]', closed: 'right-10' },
	right: { open: 'left-96', closed: 'left-10' },
} as const;

type Side = 'left' | 'right';

/** How every panel (and the sidebar) folds and opens: a short, eased slide of its width */
export const PANEL_MOTION = 'transition-[width] duration-200 ease-out';

/**
 * The space a side panel takes in the row: its width when open, the 40px rail when folded,
 * sliding between the two. A maximized panel floats over the graph from here (WIDE_STOPS_AT).
 */
export function PanelSlot({ open, width, children }: { open: boolean; width: string; children: ReactNode }) {
	return <div className={`${open ? width : 'w-10'} shrink-0 h-screen overflow-hidden ${PANEL_MOTION}`}>{children}</div>;
}

/**
 * Panels widen over the graph with a double-click on their header (no button: one fold button
 * per panel keeps the chrome minimal). Spread onto the header element.
 */
export function widenOnDoubleClick(wide: boolean, toggle: () => void) {
	return { onDoubleClick: toggle, title: wide ? 'Double-click to narrow' : 'Double-click to widen' };
}

/** Widens a panel in place, or restores it: the button beside each fold button */
export function PanelMaximizeButton({ name, wide, onClick }: { name: string; wide: boolean; onClick: () => void }) {
	const Icon = wide ? Minimize2 : Maximize2;
	return (
		<button type="button" onClick={onClick} aria-label={`${wide ? 'Restore' : 'Maximize'} ${name} panel`} title={wide ? 'Restore' : 'Maximize'} className={PANEL_BUTTON}>
			<Icon className="h-4 w-4" />
		</button>
	);
}

/** Folds a panel to the edge it sits on. Sits on the header's graph side, like the sidebar's. */
export function PanelCloseButton({ side, name, onClick }: { side: Side; name: string; onClick: () => void }) {
	const Icon = side === 'left' ? PanelLeftClose : PanelRightClose;
	return (
		<button type="button" onClick={onClick} aria-label={`Close ${name} panel`} title="Close" className={PANEL_BUTTON}>
			<Icon className="h-4 w-4" />
		</button>
	);
}

/**
 * A closed panel: a thin strip on its edge with the open button at the top
 * (in line with the other panel's header) and the panel's name written sideways.
 * The whole strip opens the panel.
 */
export function PanelRail({ side, name, onOpen }: { side: Side; name: string; onOpen: () => void }) {
	const Icon = side === 'left' ? PanelLeftOpen : PanelRightOpen;
	return (
		<button
			type="button"
			onClick={onOpen}
			aria-label={`Open ${name} panel`}
			title={`Open ${name}`}
			data-testid={`${side}-rail`}
			className={`w-10 shrink-0 h-screen bg-card flex flex-col items-center hover:bg-accent/40 transition-colors ${
				side === 'left' ? 'border-r' : 'border-l'
			} border-sidebar-border`}>
			<span className="h-12 w-full shrink-0 border-b border-sidebar-border flex items-center justify-center text-sidebar-foreground/70">
				<Icon className="h-4 w-4" />
			</span>
			<span className="mt-4 text-xs font-medium text-sidebar-foreground/70 [writing-mode:vertical-rl] rotate-180 capitalize">
				{name}
			</span>
		</button>
	);
}
