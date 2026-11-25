'use client';

import { useRef } from 'react';
import { useClickOutside } from '@/hooks/use-click-outside';
import { analyzeInNewChat } from '@/lib/chat/new-chat';
import { useContextStore } from '@/lib/stores/context-store';
import type { Node } from '@/lib/config/types';

export interface ClusterMenuState {
	name: string;
	nodes: Node[];
	/** Where it was clicked, in page pixels */
	x: number;
	y: number;
}

const item = 'w-full rounded-md px-3 py-2 text-left hover:bg-gray-100';

/** Clicking a cluster's shaded area: "High-risk obligations · 12" with what to do with all of them */
export function ClusterMenu({ menu, onClose }: { menu: ClusterMenuState; onClose: () => void }) {
	const ref = useRef<HTMLDivElement>(null);
	useClickOutside(ref, onClose);
	const run = (action: () => void) => () => {
		action();
		onClose();
	};
	return (
		<div
			ref={ref}
			role="menu"
			aria-label={`Cluster ${menu.name}`}
			className="fixed z-50 w-64 rounded-lg border border-gray-200 bg-white p-1 text-sm shadow-lg"
			// Keep it on screen near the click
			style={{ left: Math.min(menu.x, window.innerWidth - 272), top: Math.min(menu.y, window.innerHeight - 140) }}>
			<p className="px-3 pt-2 pb-1 text-xs text-gray-500">
				{menu.name} · {menu.nodes.length} document{menu.nodes.length === 1 ? '' : 's'}
			</p>
			<button type="button" role="menuitem" className={`${item} font-medium`} onClick={run(() => analyzeInNewChat(`Cluster: ${menu.name}`, menu.nodes))}>
				Analyze in a new chat
			</button>
			<button type="button" role="menuitem" className={item} onClick={run(() => useContextStore.getState().addNodesToContext(menu.nodes as never))}>
				Add all to this chat
			</button>
		</div>
	);
}
