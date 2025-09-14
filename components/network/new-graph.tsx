'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import type { GraphCanvasRef, GraphNode, GraphEdge } from 'reagraph';
import { useSelection } from 'reagraph';
import { nodeColors } from '@/lib/theme/colors';

// Dynamically import GraphCanvas with SSR disabled to maintain Next.js compatibility
const GraphCanvas = dynamic(
	() =>
		import('reagraph').then((m) => {
			// Log the module to inspect available layouts
			console.log('Reagraph module:', m);
			return m.GraphCanvas;
		}),
	{ ssr: false }
);

interface Node {
	id: string;
	label: string;
	type: string;
	size: number;
	color: string;
	summary: string; // Brief description for tooltip
	content: string; // Full article content for modal
	similarity?: number;
	url?: string;
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
	sourceType?: string;
}

interface Link {
	source: string;
	target: string;
	type: string;
	strength: number;
}

interface NetworkGraphProps {
	nodes: Node[];
	links: Link[];
	highlightedNodes: string[];
	highlightedLinks: string[];
	showLabels: boolean;
	onNodeClick?: (node: Node) => void;
	onNodeSelection?: (nodeIds: string[]) => void;
	selectedNodes?: string[];
	expandedNodes?: string[];
	onNodeExpand?: (nodeId: string) => void;
	layoutType?: 'forceDirected' | 'concentric' | 'radial';
	onReorganizeLayout?: React.MutableRefObject<(() => void) | null>;
	onArrangeAsTree?: React.MutableRefObject<(() => void) | null>;
}

export default function NetworkGraph({
	nodes,
	links,
	highlightedNodes,
	highlightedLinks,
	showLabels,
	onNodeClick,
	onNodeSelection,
	selectedNodes = [],
	expandedNodes = [],
	onNodeExpand,
	layoutType = 'forceDirected',
	onReorganizeLayout,
	onArrangeAsTree,
}: NetworkGraphProps) {
	// Reference to the GraphCanvas component
	const ref = useRef<GraphCanvasRef | null>(null);

	// State for dimensions and layout
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
	const [currentLayout, setCurrentLayout] = useState(layoutType);

	// State for tooltips and modals
	const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const hideTooltipTimeoutRef = useRef<number | null>(null);

	// State for context menu type
	const [useRadialMenu, setUseRadialMenu] = useState(true);

	// State for modal
	const [showModal, setShowModal] = useState(false);
	const [selectedArticle, setSelectedArticle] = useState<Node | null>(null);
	const [summaryExpanded, setSummaryExpanded] = useState(true);
	const [contentExpanded, setContentExpanded] = useState(true);

	// State for dropdown menus
	const [showTooltipDropdown, setShowTooltipDropdown] = useState(false);
	const [showModalDropdown, setShowModalDropdown] = useState(false);
	const [tooltipDropdownAnimating, setTooltipDropdownAnimating] =
		useState(false);
	const [modalDropdownAnimating, setModalDropdownAnimating] = useState(false);

	// Node positions reference for maintaining positions during updates
	const nodePositionsRef = useRef<
		Map<string, { x: number; y: number; z: number }>
	>(new Map());

	// Convert nodes and links to Reagraph format
	const graphNodes: GraphNode[] = nodes.map((node) => ({
		id: node.id,
		label: node.label,
		fill: node.color, // Add fill property for node coloring
		data: {
			...node,
			// Store original node data for tooltips and other functionality
		},
	}));

	const graphEdges: GraphEdge[] = links.map((link, index) => ({
		id: `${link.source}-${link.target}`,
		source: link.source,
		target: link.target,
		label: link.type,
		data: {
			...link,
			strength: link.strength,
			highlighted: highlightedLinks.includes(`${link.source}-${link.target}`),
		},
	}));

	// Selection hook from Reagraph
	const {
		selections,
		onNodeClick: handleNodeClick,
		onCanvasClick,
	} = useSelection({
		ref,
		nodes: graphNodes,
		edges: graphEdges,
	});

	// Update dimensions on resize
	useEffect(() => {
		const updateDimensions = () => {
			const container = document.querySelector('.network-graph-container');
			if (container) {
				const rect = container.getBoundingClientRect();
				setDimensions({ width: rect.width, height: rect.height });
			}
		};

		updateDimensions();
		window.addEventListener('resize', updateDimensions);
		return () => window.removeEventListener('resize', updateDimensions);
	}, []);

	// Handle layout changes
	useEffect(() => {
		// Update current layout when prop changes
		setCurrentLayout(layoutType);
	}, [layoutType]);

	// Handle layout reorganization
	useEffect(() => {
		if (onReorganizeLayout) {
			onReorganizeLayout.current = () => {
				nodePositionsRef.current.clear();
				if (ref.current) {
					ref.current.resetCamera();
					ref.current.forceUpdate();
				}
			};
		}

		if (onArrangeAsTree) {
			onArrangeAsTree.current = () => {
				nodePositionsRef.current.clear();
				if (ref.current) {
					ref.current.resetCamera();
					ref.current.forceUpdate();
				}
			};
		}
	}, [onReorganizeLayout, onArrangeAsTree]);

	// Custom node click handler to work with existing code
	const handleCustomNodeClick = (node: GraphNode) => {
		// Only call the built-in handler if the ref exists
		if (ref.current) {
			handleNodeClick(node);
		}

		// Call the custom handler if provided
		if (onNodeClick && node.data) {
			onNodeClick(node.data as Node);
		}

		// Update selected nodes if handler is provided
		if (onNodeSelection) {
			// Get current selections from the Reagraph selection hook
			const newSelections = selections.nodes.map((n) => n.id);

			// If the clicked node isn't already in the selections, add it
			if (!newSelections.includes(node.id)) {
				newSelections.push(node.id);
			}

			// Update the selected nodes in the parent component
			onNodeSelection(newSelections);
		}
	};

	// Smart tooltip positioning
	const getSmartTooltipPosition = (mouseX: number, mouseY: number) => {
		const tooltipWidth = 360;
		const tooltipHeight = 250;
		const offset = 8;
		const margin = 10;

		let left = mouseX + offset;
		let top = mouseY - offset;

		if (left + tooltipWidth + margin > window.innerWidth) {
			left = mouseX - tooltipWidth - offset;
		}

		if (left < margin) {
			left = margin;
		}

		if (top + tooltipHeight + margin > window.innerHeight) {
			top = mouseY - tooltipHeight - offset;
		}

		if (top < margin) {
			top = mouseY + offset + 20;
		}

		left = Math.max(
			margin,
			Math.min(left, window.innerWidth - tooltipWidth - margin)
		);
		top = Math.max(
			margin,
			Math.min(top, window.innerHeight - tooltipHeight - margin)
		);

		return { left, top };
	};

	// Dropdown toggle handlers
	const handleTooltipDropdownToggle = () => {
		if (showTooltipDropdown) {
			setTooltipDropdownAnimating(true);
			setTimeout(() => {
				setShowTooltipDropdown(false);
				setTooltipDropdownAnimating(false);
			}, 150);
		} else {
			setShowTooltipDropdown(true);
			setTooltipDropdownAnimating(true);
			setTimeout(() => {
				setTooltipDropdownAnimating(false);
			}, 200);
		}
	};

	const handleModalDropdownToggle = () => {
		if (showModalDropdown) {
			setModalDropdownAnimating(true);
			setTimeout(() => {
				setShowModalDropdown(false);
				setModalDropdownAnimating(false);
			}, 150);
		} else {
			setShowModalDropdown(true);
			setModalDropdownAnimating(true);
			setTimeout(() => {
				setModalDropdownAnimating(false);
			}, 200);
		}
	};

	// Handle node hover for tooltips
	const handleNodeHover = (node: GraphNode | null) => {
		if (node) {
			setHoveredNode(node.data as Node);
		} else {
			// Use timeout to prevent flickering when moving between nodes
			hideTooltipTimeoutRef.current = window.setTimeout(() => {
				setHoveredNode(null);
			}, 200);
		}
	};

	// Track mouse position for tooltip placement
	const handleMouseMove = (e: React.MouseEvent) => {
		setMousePos({ x: e.clientX, y: e.clientY });
	};

	// Determine layout type based on current layout
	const reagraphLayoutType =
		currentLayout === 'forceDirected'
			? 'forceDirected2d'
			: currentLayout === 'concentric'
			? 'concentric2d'
			: 'radialOut2d'; // Default to radialOut2d for radial layout

	// Layout overrides for different layouts
	const layoutOverrides =
		currentLayout === 'forceDirected'
			? {
					linkDistance: 100, // Standard distance for force-directed
					nodeStrength: -300, // Standard repulsion
					clusterStrength: 0.8,
					linkStrengthIntraCluster: 0.8,
					linkStrengthInterCluster: 0.3,
					centerInertia: 1,
					dimensions: 2,
			  }
			: currentLayout === 'concentric'
			? {
					radius: 150, // Base radius for concentric layout
					concentricSpacing: 120, // Distance between concentric circles
					// Note: Nodes should ideally have a 'level' property for best results
			  }
			: {
					// Radial layout parameters
					linkDistance: 80,
					nodeStrength: -200,
					centerInertia: 1,
					dimensions: 2,
			  };

	return (
		<div
			className="network-graph-container relative w-full h-full"
			onMouseMove={handleMouseMove}>
			<GraphCanvas
				ref={ref}
				nodes={graphNodes}
				edges={graphEdges}
				layoutType={reagraphLayoutType as any}
				layoutOverrides={layoutOverrides}
				draggable={true}
				selections={selections}
				onNodeClick={handleCustomNodeClick}
				onCanvasClick={onCanvasClick}
				onNodeHover={handleNodeHover}
				animated={true} // Enable animation for all layouts
				labelType={showLabels ? 'all' : 'none'}
				edgeStyle="curved"
				sizingType="attribute"
				sizingAttribute="size"
				minNodeSize={5}
				maxNodeSize={25}
				nodeColor={(node) => {
					const isHighlighted = highlightedNodes.includes(node.id);
					const isSelected = selectedNodes.includes(node.id);
					const isExpanded = expandedNodes.includes(node.id);

					if (isSelected) return nodeColors.primary; // Selected color (blue)
					if (isExpanded) return nodeColors.secondary; // Expanded color (green)
					if (isHighlighted) return nodeColors.neutral; // Highlighted color (gray)

					return node.fill || (node.data as Node).color; // Use fill property with fallback to node data
				}}
				nodeOutline={(node) => {
					const isHighlighted = highlightedNodes.includes(node.id);
					const isSelected = selectedNodes.includes(node.id);
					const isExpanded = expandedNodes.includes(node.id);

					if (isSelected) return { color: nodeColors.primary, width: 3 };
					if (isExpanded) return { color: nodeColors.secondary, width: 3 };
					if (isHighlighted) return { color: nodeColors.neutral, width: 2 };

					return { color: 'transparent', width: 0 };
				}}
				edgeColor={(edge) => {
					const isHighlighted = highlightedLinks.includes(edge.id);
					const isNodeHighlighted =
						highlightedNodes.includes(edge.source) ||
						highlightedNodes.includes(edge.target);

					return isHighlighted || isNodeHighlighted
						? nodeColors.neutral
						: '#d1d5db';
				}}
				edgeWidth={(edge) => {
					const isHighlighted = highlightedLinks.includes(edge.id);
					const isNodeHighlighted =
						highlightedNodes.includes(edge.source) ||
						highlightedNodes.includes(edge.target);

					return isHighlighted || isNodeHighlighted
						? 2
						: Math.max(1, (edge.data as Link).strength);
				}}
				getNodePosition={(id) => {
					return nodePositionsRef.current.get(id) || null;
				}}
				onNodeDragEnd={(node, position) => {
					nodePositionsRef.current.set(node.id, position);
				}}
			/>

			{/* Node tooltip */}
			{hoveredNode && (
				<Card
					data-tooltip="true"
					className="fixed z-50 p-4 bg-white border border-gray-200 shadow-xl transition-all duration-200 ease-out rounded-lg"
					style={{
						left: `${getSmartTooltipPosition(mousePos.x, mousePos.y).left}px`,
						top: `${getSmartTooltipPosition(mousePos.x, mousePos.y).top}px`,
						width: '360px',
						pointerEvents: 'auto',
					}}
					onMouseEnter={() => {
						if (hideTooltipTimeoutRef.current) {
							clearTimeout(hideTooltipTimeoutRef.current);
							hideTooltipTimeoutRef.current = null;
						}
					}}
					onMouseLeave={() => {
						setHoveredNode(null);
					}}>
					<div className="space-y-4">
						<div className="flex items-start justify-between">
							<div className="font-semibold text-[#1f2937] text-base leading-tight">
								{hoveredNode.label}
							</div>
							<div className="relative flex-shrink-0">
								<button
									className="text-xs px-3 py-1 rounded-md bg-[#a855f7] hover:bg-[#9333ea] text-white transition-all duration-200 flex items-center gap-1"
									onClick={handleTooltipDropdownToggle}>
									<span>Actions</span>
									<svg
										className={`w-3 h-3 transition-transform duration-200 ${
											showTooltipDropdown ? 'rotate-180' : ''
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

								{showTooltipDropdown && (
									<div
										className={`absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md py-1 min-w-[160px] z-10 overflow-hidden transition-all duration-200 ease-out transform-gpu origin-top-right shadow-lg`}>
										<button
											className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
											onClick={() => {
												if (onNodeSelection && hoveredNode) {
													const currentSelected = selectedNodes || [];
													const isAlreadySelected = currentSelected.includes(
														hoveredNode.id
													);
													if (isAlreadySelected) {
														onNodeSelection(
															currentSelected.filter(
																(id) => id !== hoveredNode.id
															)
														);
													} else {
														onNodeSelection([
															...currentSelected,
															hoveredNode.id,
														]);
													}
												}
												setShowTooltipDropdown(false);
												setTooltipDropdownAnimating(false);
											}}>
											{selectedNodes?.includes(hoveredNode.id)
												? 'Remove from Selection ✓'
												: 'Add to Selection'}
										</button>
										<button
											className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
											onClick={() => {
												setSelectedArticle(hoveredNode);
												setShowModal(true);
												setShowTooltipDropdown(false);
												setTooltipDropdownAnimating(false);
											}}>
											Read More
										</button>
										{onNodeExpand && (
											<button
												className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
												onClick={() => {
													onNodeExpand(hoveredNode.id);
													setShowTooltipDropdown(false);
													setTooltipDropdownAnimating(false);
												}}>
												{expandedNodes?.includes(hoveredNode.id)
													? 'Collapse Node'
													: 'Expand Node'}
											</button>
										)}
										<div className="border-t border-gray-200 my-1"></div>
										<button
											className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
											onClick={() => {
												window.open(
													hoveredNode.url || 'https://www.google.com',
													'_blank'
												);
												setShowTooltipDropdown(false);
												setTooltipDropdownAnimating(false);
											}}>
											Open Link
										</button>
									</div>
								)}
							</div>
						</div>

						<div className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded-md">
							<div className="flex items-center pr-3 border-r border-gray-200">
								<span className="text-[#6b7280]">Type:</span>{' '}
								<span className="font-medium text-[#374151] ml-1">
									{hoveredNode.type}
								</span>
							</div>
							<div className="flex items-center pr-3 border-r border-gray-200">
								<span className="text-[#6b7280]">Size:</span>{' '}
								<span className="font-medium text-[#374151] ml-1">
									{hoveredNode.size}
								</span>
							</div>
							{hoveredNode.similarity && (
								<div className="flex items-center">
									<span className="text-[#6b7280]">Similarity:</span>{' '}
									<span className="font-medium text-[#374151] ml-1">
										{hoveredNode.similarity.toFixed(1)}%
									</span>
								</div>
							)}
						</div>

						{hoveredNode.summary && (
							<div>
								<div className="text-xs font-medium text-[#6b7280] mb-2">
									Summary:
								</div>
								<div className="text-sm text-[#374151] h-28 min-h-20 overflow-y-auto leading-relaxed bg-white p-3 rounded border border-gray-200">
									{hoveredNode.summary}
								</div>
							</div>
						)}
					</div>
				</Card>
			)}

			{/* Modal for detailed node view */}
			{showModal && selectedArticle && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center">
					<div
						className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
						onClick={() => {
							setShowModal(false);
							setShowModalDropdown(false);
						}}
					/>
					<div className="relative bg-white border border-gray-200 shadow-xl rounded-lg max-w-2xl max-h-[90vh] w-full mx-4 overflow-hidden flex flex-col">
						<div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex-shrink-0">
							<div className="flex justify-between items-start mb-3">
								<div className="flex-1">
									<h2 className="text-xl font-semibold text-[#1f2937] mb-3">
										{selectedArticle.label}
									</h2>

									<div className="flex items-center text-sm text-[#6b7280]">
										<span>{selectedArticle.type}</span>
										<span className="mx-2">•</span>
										<span>{selectedArticle.sourceType}</span>
										{selectedArticle.similarity && (
											<>
												<span className="mx-2">•</span>
												<span>
													Similarity: {selectedArticle.similarity.toFixed(1)}%
												</span>
											</>
										)}
										<span className="mx-2">•</span>
										<span>Size: {selectedArticle.size}</span>
									</div>
								</div>

								<div className="flex items-center gap-2 flex-shrink-0">
									<div className="relative">
										<button
											className="text-xs px-3 py-1 rounded-md bg-[#a855f7] hover:bg-[#9333ea] text-white transition-all duration-200 flex items-center gap-1"
											onClick={handleModalDropdownToggle}>
											<span>Actions</span>
											<svg
												className={`w-3 h-3 transition-transform duration-200 ${
													showModalDropdown ? 'rotate-180' : ''
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

										{showModalDropdown && (
											<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md py-1 min-w-[160px] z-10 overflow-hidden shadow-lg">
												<button
													className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
													onClick={() => {
														if (onNodeSelection && selectedArticle) {
															const currentSelected = selectedNodes || [];
															const isAlreadySelected =
																currentSelected.includes(selectedArticle.id);
															if (isAlreadySelected) {
																onNodeSelection(
																	currentSelected.filter(
																		(id) => id !== selectedArticle.id
																	)
																);
															} else {
																onNodeSelection([
																	...currentSelected,
																	selectedArticle.id,
																]);
															}
														}
														setShowModalDropdown(false);
														setModalDropdownAnimating(false);
													}}>
													{selectedNodes?.includes(selectedArticle.id)
														? 'Remove from Selection ✓'
														: 'Add to Selection'}
												</button>
												{onNodeExpand && (
													<button
														className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
														onClick={() => {
															onNodeExpand(selectedArticle.id);
															setShowModalDropdown(false);
															setModalDropdownAnimating(false);
														}}>
														{expandedNodes?.includes(selectedArticle.id)
															? 'Collapse Node'
															: 'Expand Node'}
													</button>
												)}
												<div className="border-t border-gray-200 my-1"></div>
												<button
													className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
													onClick={() => {
														window.open(
															selectedArticle.url || 'https://www.google.com',
															'_blank'
														);
														setShowModalDropdown(false);
														setModalDropdownAnimating(false);
													}}>
													Open Link
												</button>
											</div>
										)}
									</div>

									<button
										onClick={() => {
											setShowModal(false);
											setShowModalDropdown(false);
										}}
										className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
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
						</div>

						<div className="flex-1 overflow-y-auto p-4">
							<div className="space-y-4">
								<div>
									<button
										onClick={() => setSummaryExpanded(!summaryExpanded)}
										className="w-full flex justify-between items-center cursor-pointer p-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors rounded-md">
										<span className="font-medium text-[#1f2937]">Summary</span>
										<svg
											className={`w-5 h-5 text-[#6b7280] transition-transform duration-200 ${
												summaryExpanded ? 'rotate-180' : ''
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

									{summaryExpanded && (
										<div className="mt-2 p-3 border border-gray-200 rounded-md bg-white">
											<p className="text-sm text-[#374151] leading-relaxed">
												{selectedArticle.summary}
											</p>
										</div>
									)}
								</div>

								<div>
									<button
										onClick={() => setContentExpanded(!contentExpanded)}
										className="w-full flex justify-between items-center cursor-pointer p-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors rounded-md">
										<span className="font-medium text-[#1f2937]">
											Full Content
										</span>
										<svg
											className={`w-5 h-5 text-[#6b7280] transition-transform duration-200 ${
												contentExpanded ? 'rotate-180' : ''
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

									{contentExpanded && (
										<div className="mt-2 p-3 border border-gray-200 rounded-md bg-white max-h-[400px] overflow-y-auto">
											<p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
												{selectedArticle.content}
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
