'use client';

import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

/**
 * The pieces both side panels share, so they line up: one header height, and
 * the thin rail a panel folds into when it's closed.
 */

/** Every side panel's top bar: same height and divider on both sides */
export const PANEL_HEADER = 'h-12 shrink-0 border-b border-sidebar-border flex items-center gap-2 px-2';

/** The small ghost buttons in a panel header (» «, close) */
export const PANEL_BUTTON =
	'h-7 min-w-7 px-1.5 rounded-md flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-accent/50';

type Side = 'left' | 'right';

/** Folds a panel to the edge it sits on */
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
			className={`w-10 shrink-0 h-screen bg-sidebar flex flex-col items-center hover:bg-accent/40 transition-colors ${
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
