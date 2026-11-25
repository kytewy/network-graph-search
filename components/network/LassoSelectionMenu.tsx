'use client';

import { useRef, useMemo } from 'react';
import { analyzeInNewChat } from '@/lib/chat/new-chat';
import { Button } from '@/components/ui/button';
import { Node } from '@/lib/config/types';
import { useAppStore } from '@/lib/stores/app-state';
import { useClickOutside } from '@/hooks/use-click-outside';
import { useMultiNodeContextOperations } from '@/hooks/use-node-context-operations';

interface LassoSelectionMenuProps {
	className?: string;
}

export function LassoSelectionMenu({ className }: LassoSelectionMenuProps) {
	// Lasso state and the documents on the graph, from the store
	const lassoSelectedNodes = useAppStore((state) => state.lassoNodes);
	const showLassoMenu = useAppStore((state) => state.lassoMenuOpen);
	const onClose = useAppStore((state) => state.closeLasso);
	const filteredResults = useAppStore((state) => state.filteredResults);

	// Get selected nodes from filtered results - memoized for performance
	const selectedNodes = useMemo(
		() => {
			const safeFilteredResults = Array.isArray(filteredResults) ? filteredResults : [];
			const safeLassoSelectedNodes = Array.isArray(lassoSelectedNodes) ? lassoSelectedNodes : [];
			return safeFilteredResults.filter((node) => safeLassoSelectedNodes.includes(node.id));
		},
		[filteredResults, lassoSelectedNodes]
	);

	const menuRef = useRef<HTMLDivElement>(null);

	// Use reusable hooks
	useClickOutside(menuRef, onClose);
	const { addAllToContext } = useMultiNodeContextOperations(selectedNodes);

	const handleSendToContext = () => {
		addAllToContext();
		onClose();
	};

	const handleClearSelection = () => {
		// Just close the menu, which will clear selections
		onClose();
	};

	// Don't render if the menu shouldn't be shown
	if (!showLassoMenu || selectedNodes.length === 0) {
		return null;
	}

	// A slim bar centred at the top of the graph, clear of the side panels
	return (
		<div
			ref={menuRef}
			role="dialog"
			aria-label="Lasso selection"
			className={`absolute z-50 flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-4 pr-1.5 text-sm shadow-lg ${className || ''}`}
			style={{ top: 72, left: '50%', transform: 'translateX(-50%)', maxWidth: 'calc(100% - 2rem)' }}>
			<h3 className="whitespace-nowrap font-medium text-foreground">{selectedNodes.length} selected</h3>
			<Button variant="outline" size="sm" className="h-7 rounded-full px-3 text-xs" onClick={() => { analyzeInNewChat(`Selection: ${selectedNodes.length} documents`, selectedNodes); onClose(); }}>
				Analyze in a new chat
			</Button>
			<Button size="sm" className="h-7 rounded-full px-3 text-xs" onClick={handleSendToContext}>
				Add to this chat
			</Button>
			<button type="button" onClick={handleClearSelection} aria-label="Clear selection" className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-gray-100">
				✕
			</button>
		</div>
	);
}
