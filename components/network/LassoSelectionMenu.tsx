'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Node } from './NodeComponents';
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';

interface LassoSelectionMenuProps {
	className?: string;
}

export function LassoSelectionMenu({ className }: LassoSelectionMenuProps) {
	// Get lasso selection state and handlers from context
	const {
		lassoSelectedNodes,
		showLassoMenu,
		lassoMenuPosition: position,
		closeLassoMenu: onClose,
		handleSendToContext: onSendToContext,
		filteredResults,
	} = useNetworkGraph();

	// Get selected nodes from filtered results
	const selectedNodes = filteredResults.filter((node) =>
		lassoSelectedNodes.includes(node.id)
	);
	const [expanded, setExpanded] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Handle click outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Element)
			) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [onClose]);

	const handleSendToContext = () => {
		if (onSendToContext) {
			// Ensure each node has a content property populated
			const nodesWithContent = selectedNodes.map((node) => ({
				...node,
				// If content is missing, use summary or a default message
				content:
					node.content ||
					node.summary ||
					`No content available for ${node.label}`,
			}));

			onSendToContext(nodesWithContent);
			onClose();
		}
	};

	const handleClearSelection = () => {
		// Just close the menu, which will clear selections
		onClose();
	};

	// Don't render if the menu shouldn't be shown
	if (!showLassoMenu || selectedNodes.length === 0) {
		return null;
	}

	return (
		<div
			ref={menuRef}
			className={`absolute bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50 ${
				className || ''
			}`}
			style={{
				top: position.y,
				left: position.x,
				maxWidth: '400px',
				maxHeight: '80vh',
			}}>
			<div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center">
				<h3 className="text-lg font-semibold text-[#1f2937]">
					{selectedNodes.length} Nodes Selected
				</h3>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleClearSelection}
						className="text-xs px-3 py-1 hover:bg-gray-100">
						Clear
					</Button>
					<Button
						size="sm"
						onClick={handleSendToContext}
						className="text-xs px-3 py-1 bg-[#a855f7] hover:bg-[#9333ea] text-white">
						Send to Context
					</Button>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-md transition-colors">
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<div className="p-3">
				<button
					onClick={() => setExpanded(!expanded)}
					className="w-full flex justify-between items-center cursor-pointer p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors rounded-md">
					<span className="font-medium text-[#1f2937]">Selected Nodes</span>
					<svg
						className={`w-5 h-5 text-[#6b7280] transition-transform duration-200 ${
							expanded ? 'rotate-180' : ''
						}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{expanded && (
					<div className="mt-2 max-h-[300px] overflow-y-auto border border-gray-200 rounded-md">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 sticky top-0">
								<tr>
									<th className="text-left py-2 px-3 font-medium text-[#6b7280]">
										Label
									</th>
									<th className="text-left py-2 px-3 font-medium text-[#6b7280]">
										Type
									</th>
									<th className="text-right py-2 px-3 font-medium text-[#6b7280]">
										Chars
									</th>
								</tr>
							</thead>
							<tbody>
								{selectedNodes.map((node) => (
									<tr
										key={node.id}
										className="border-t border-gray-200 hover:bg-gray-50">
										<td className="py-2 px-3 truncate max-w-[150px]">
											{node.label}
										</td>
										<td className="py-2 px-3 text-[#6b7280]">{node.type}</td>
										<td className="py-2 px-3 text-right text-[#6b7280]">
											{(node.content?.length || 0).toLocaleString()} chars
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
