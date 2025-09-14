'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { NodeTooltip, NodeModal, Node as NodeType } from './NodeComponents';

type Node = NodeType

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
	layoutType?: 'radial' | 'tree';
	onReorganizeLayout?: () => void;
	onArrangeAsTree?: () => void;
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
	layoutType = 'radial',
	onReorganizeLayout,
	onArrangeAsTree,
}: NetworkGraphProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const hideTooltipTimeoutRef = useRef<number | null>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
	const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
	const [isDraggingNode, setIsDraggingNode] = useState(false);
	const [draggedNode, setDraggedNode] = useState<Node | null>(null);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [layoutKey, setLayoutKey] = useState(0);
	const [hoveredExpandButton, setHoveredExpandButton] = useState<string | null>(
		null
	);
	const animationRef = useRef<number>();
	const nodePositionsRef = useRef<Map<string, { x: number; y: number }>>(
		new Map()
	);
	const dragAnimationRef = useRef<number>();
	const pendingDragUpdate = useRef<{
		nodeId: string;
		x: number;
		y: number;
	} | null>(null);

	const [showModal, setShowModal] = useState(false);
	const [selectedArticle, setSelectedArticle] = useState<Node | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const staticNodes = nodes.map((node) => {
			const existingPos = nodePositionsRef.current.get(node.id);
			if (existingPos) {
				return { ...node, x: existingPos.x, y: existingPos.y };
			}

			let x: number, y: number;

			if (layoutType === 'tree') {
				const levels: string[][] = [];
				const visited = new Set<string>();
				const nodeConnections = new Map<string, string[]>();

				links.forEach((link) => {
					if (!nodeConnections.has(link.source)) {
						nodeConnections.set(link.source, []);
					}
					nodeConnections.get(link.source)?.push(link.target);
				});

				const hasIncoming = new Set<string>();
				links.forEach((link) => hasIncoming.add(link.target));
				const rootNodes = nodes.filter((node) => !hasIncoming.has(node.id));

				if (rootNodes.length === 0 && nodes.length > 0) {
					rootNodes.push(nodes[0]);
				}

				let currentLevel = rootNodes.map((n) => n.id);
				while (currentLevel.length > 0) {
					levels.push([...currentLevel]);
					currentLevel.forEach((nodeId) => visited.add(nodeId));

					const nextLevel: string[] = [];
					currentLevel.forEach((nodeId) => {
						const connections = nodeConnections.get(nodeId) || [];
						connections.forEach((targetId) => {
							if (!visited.has(targetId) && !nextLevel.includes(targetId)) {
								nextLevel.push(targetId);
							}
						});
					});
					currentLevel = nextLevel;
				}

				const allLevelNodes = new Set(levels.flat());
				const remainingNodes = nodes.filter((n) => !allLevelNodes.has(n.id));
				if (remainingNodes.length > 0) {
					levels.push(remainingNodes.map((n) => n.id));
				}

				let nodeLevel = 0;
				let nodeIndexInLevel = 0;
				for (let i = 0; i < levels.length; i++) {
					const levelIndex = levels[i].indexOf(node.id);
					if (levelIndex !== -1) {
						nodeLevel = i;
						nodeIndexInLevel = levelIndex;
						break;
					}
				}

				const levelHeight = dimensions.height / (levels.length + 1);
				const nodeWidth = dimensions.width / (levels[nodeLevel].length + 1);

				x = nodeWidth * (nodeIndexInLevel + 1);
				y = levelHeight * (nodeLevel + 1);
			} else {
				const angle = (nodes.indexOf(node) / nodes.length) * 2 * Math.PI;
				const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
				const centerX = dimensions.width / 2;
				const centerY = dimensions.height / 2;
				x = centerX + Math.cos(angle) * radius;
				y = centerY + Math.sin(angle) * radius;
			}

			nodePositionsRef.current.set(node.id, { x, y });
			return { ...node, x, y };
		});

		const render = () => {
			ctx.clearRect(0, 0, dimensions.width, dimensions.height);

			links.forEach((link) => {
				const source = staticNodes.find((n) => n.id === link.source);
				const target = staticNodes.find((n) => n.id === link.target);
				if (source && target) {
					const isHighlighted = highlightedLinks.includes(
						`${link.source}-${link.target}`
					);
					const isNodeHighlighted =
						highlightedNodes.includes(link.source) ||
						highlightedNodes.includes(link.target);

					ctx.beginPath();
					ctx.moveTo(source.x ?? 0, source.y ?? 0);
					ctx.lineTo(target.x ?? 0, target.y ?? 0);
					ctx.strokeStyle =
						isHighlighted || isNodeHighlighted ? '#6b7280' : '#d1d5db';
					ctx.lineWidth =
						isHighlighted || isNodeHighlighted ? 2 : Math.max(1, link.strength);
					ctx.stroke();

					const angle = Math.atan2(
						(target.y ?? 0) - (source.y ?? 0),
						(target.x ?? 0) - (source.x ?? 0)
					);
					const arrowLength = 10;
					const arrowX = (target.x ?? 0) - Math.cos(angle) * (target.size + 5);
					const arrowY = (target.y ?? 0) - Math.sin(angle) * (target.size + 5);

					ctx.beginPath();
					ctx.moveTo(arrowX, arrowY);
					ctx.lineTo(
						arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
						arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
					);
					ctx.moveTo(arrowX, arrowY);
					ctx.lineTo(
						arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
						arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
					);
					ctx.strokeStyle =
						isHighlighted || isNodeHighlighted ? '#6b7280' : '#d1d5db';
					ctx.lineWidth = 2;
					ctx.stroke();
				}
			});

			staticNodes.forEach((node) => {
				const isHighlighted = highlightedNodes.includes(node.id);
				const isSelected = selectedNodes.includes(node.id);
				const isExpanded = expandedNodes.includes(node.id);
				const isHovered = hoveredNode?.id === node.id;

				ctx.beginPath();
				ctx.arc(node.x ?? 0, node.y ?? 0, node.size, 0, 2 * Math.PI);

				ctx.fillStyle = node.color;
				ctx.fill();

				if (isHighlighted) {
					ctx.strokeStyle = '#6b7280';
					ctx.lineWidth = 2;
					ctx.stroke();
				}

				if (isSelected) {
					ctx.strokeStyle = '#1d4ed8';
					ctx.lineWidth = 3;
					ctx.stroke();
				}

				if (isExpanded) {
					ctx.strokeStyle = '#059669';
					ctx.lineWidth = 3;
					ctx.stroke();
				}

				if (isHovered && !isHighlighted && !isSelected && !isExpanded) {
					ctx.strokeStyle = '#6b7280';
					ctx.lineWidth = 2;
					ctx.stroke();
				}

				if (onNodeExpand && isHovered) {
					const buttonSize = 10;
					const buttonX = (node.x ?? 0) - node.size + buttonSize / 2;
					const buttonY = (node.y ?? 0) - node.size + buttonSize / 2;

					ctx.beginPath();
					ctx.arc(buttonX, buttonY, buttonSize, 0, 2 * Math.PI);
					ctx.fillStyle =
						hoveredExpandButton === node.id ? '#7c3aed' : '#ffffff';
					ctx.fill();
					ctx.strokeStyle = '#7c3aed';
					ctx.lineWidth = 2;
					ctx.stroke();

					ctx.strokeStyle =
						hoveredExpandButton === node.id ? '#ffffff' : '#7c3aed';
					ctx.lineWidth = 2;
					ctx.beginPath();
					if (isExpanded) {
						ctx.moveTo(buttonX - 4, buttonY);
						ctx.lineTo(buttonX + 4, buttonY);
					} else {
						ctx.moveTo(buttonX - 4, buttonY);
						ctx.lineTo(buttonX + 4, buttonY);
						ctx.moveTo(buttonX, buttonY - 4);
						ctx.lineTo(buttonX, buttonY + 4);
					}
					ctx.stroke();
				}

				if (showLabels) {
					ctx.fillStyle = '#374151';
					ctx.font = '12px sans-serif';
					ctx.textAlign = 'center';
					ctx.fillText(node.label, node.x ?? 0, (node.y ?? 0) + node.size + 15);
				}
			});

			if (isDragging) {
				ctx.strokeStyle = '#3b82f6';
				ctx.lineWidth = 2;
				ctx.setLineDash([5, 5]);
				ctx.strokeRect(
					Math.min(dragStart.x, dragEnd.x),
					Math.min(dragStart.y, dragEnd.y),
					Math.abs(dragEnd.x - dragStart.x),
					Math.abs(dragEnd.y - dragStart.y)
				);
				ctx.setLineDash([]);
			}
		};

		render();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [
		nodes,
		links,
		dimensions,
		highlightedNodes,
		highlightedLinks,
		showLabels,
		hoveredNode,
		selectedNodes,
		expandedNodes,
		hoveredExpandButton,
		isDragging,
		dragStart,
		dragEnd,
		layoutKey,
		onNodeExpand,
		layoutType,
	]);

	useEffect(() => {
		const updateDimensions = () => {
			const canvas = canvasRef.current;
			if (canvas && canvas.parentElement) {
				const rect = canvas.parentElement.getBoundingClientRect();
				setDimensions({ width: rect.width, height: rect.height });
			}
		};

		updateDimensions();
		window.addEventListener('resize', updateDimensions);
		return () => window.removeEventListener('resize', updateDimensions);
	}, []);

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		setMousePos({ x: e.clientX, y: e.clientY });

		if (isDraggingNode && draggedNode) {
			const newX = x - dragOffset.x;
			const newY = y - dragOffset.y;

			pendingDragUpdate.current = { nodeId: draggedNode.id, x: newX, y: newY };

			if (!dragAnimationRef.current) {
				const updateDragPosition = () => {
					if (pendingDragUpdate.current) {
						const { nodeId, x: newX, y: newY } = pendingDragUpdate.current;
						nodePositionsRef.current.set(nodeId, { x: newX, y: newY });
						pendingDragUpdate.current = null;

						setLayoutKey((prev) => prev + 0.001);
					}
					dragAnimationRef.current = undefined;
				};

				dragAnimationRef.current = requestAnimationFrame(updateDragPosition);
			}
			return;
		}

		if (isDragging) {
			setDragEnd({ x, y });
			return;
		}

		let hoveredExpandBtn: string | null = null;
		if (onNodeExpand) {
			for (const node of nodes) {
				const pos = nodePositionsRef.current.get(node.id);
				if (!pos) continue;

				const buttonSize = 10;
				const clickableSize = 12;
				const buttonX = pos.x - node.size + buttonSize / 2;
				const buttonY = pos.y - node.size + buttonSize / 2;
				const dx = x - buttonX;
				const dy = y - buttonY;

				if (Math.sqrt(dx * dx + dy * dy) <= clickableSize) {
					hoveredExpandBtn = node.id;
					break;
				}
			}
		}
		setHoveredExpandButton(hoveredExpandBtn);

		const hovered = nodes.find((node) => {
			const pos = nodePositionsRef.current.get(node.id);
			if (!pos) return false;
			const dx = x - pos.x;
			const dy = y - pos.y;
			return Math.sqrt(dx * dx + dy * dy) <= node.size;
		});
		setHoveredNode(hovered || null);
	};

	const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
		// Increase the delay to give more time to move to the tooltip
		hideTooltipTimeoutRef.current = window.setTimeout(() => {
			// Only clear the hovered node if we're not hovering over the tooltip
			// The tooltip component will handle its own hover state
			setHoveredNode(null);
		}, 500);

		setHoveredExpandButton(null);
		setIsDragging(false);
		if (isDraggingNode) {
			setIsDraggingNode(false);
			setDraggedNode(null);
			if (dragAnimationRef.current) {
				cancelAnimationFrame(dragAnimationRef.current);
				dragAnimationRef.current = undefined;
			}
		}
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (onNodeExpand) {
			for (const node of nodes) {
				const pos = nodePositionsRef.current.get(node.id);
				if (!pos) continue;

				const buttonSize = 10;
				const clickableSize = 12;
				const buttonX = pos.x - node.size + buttonSize / 2;
				const buttonY = pos.y - node.size + buttonSize / 2;
				const dx = x - buttonX;
				const dy = y - buttonY;

				if (Math.sqrt(dx * dx + dy * dy) <= clickableSize) {
					onNodeExpand(node.id);
					return;
				}
			}
		}

		const clickedNode = nodes.find((node) => {
			const pos = nodePositionsRef.current.get(node.id);
			if (!pos) return false;
			const dx = x - pos.x;
			const dy = y - pos.y;
			return Math.sqrt(dx * dx + dy * dy) <= node.size;
		});

		if (clickedNode) {
			if (e.shiftKey) {
				const pos = nodePositionsRef.current.get(clickedNode.id);
				if (pos) {
					setIsDraggingNode(true);
					setDraggedNode(clickedNode);
					setDragOffset({ x: x - pos.x, y: y - pos.y });
				}
			} else {
				if (onNodeSelection) {
					const currentSelected = selectedNodes || [];
					const isAlreadySelected = currentSelected.includes(clickedNode.id);
					if (isAlreadySelected) {
						onNodeSelection(
							currentSelected.filter((id) => id !== clickedNode.id)
						);
					} else {
						onNodeSelection([...currentSelected, clickedNode.id]);
					}
				}
				if (onNodeClick) {
					onNodeClick(clickedNode);
				}
			}
		} else {
			setIsDragging(true);
			setDragStart({ x, y });
			setDragEnd({ x, y });
		}
	};

	const handleMouseUp = () => {
		if (isDraggingNode) {
			setIsDraggingNode(false);
			setDraggedNode(null);
			if (dragAnimationRef.current) {
				cancelAnimationFrame(dragAnimationRef.current);
				dragAnimationRef.current = undefined;
			}
			return;
		}

		if (isDragging && onNodeSelection) {
			const minX = Math.min(dragStart.x, dragEnd.x);
			const maxX = Math.max(dragStart.x, dragEnd.x);
			const minY = Math.min(dragStart.y, dragEnd.y);
			const maxY = Math.max(dragStart.y, dragEnd.y);

			const selectedNodeIds = nodes
				.filter((node) => {
					const pos = nodePositionsRef.current.get(node.id);
					if (!pos) return false;
					return (
						pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY
					);
				})
				.map((node) => node.id);

			onNodeSelection(selectedNodeIds);
		}

		setIsDragging(false);
	};

	const reorganizeLayout = () => {
		nodePositionsRef.current.clear();
		setLayoutKey((prev) => prev + 1);
	};

	const arrangeAsTree = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const levels: string[][] = [];
		const visited = new Set<string>();
		const nodeConnections = new Map<string, string[]>();

		links.forEach((link) => {
			if (!nodeConnections.has(link.source)) {
				nodeConnections.set(link.source, []);
			}
			nodeConnections.get(link.source)?.push(link.target);
		});

		const hasIncoming = new Set<string>();
		links.forEach((link) => hasIncoming.add(link.target));
		const rootNodes = nodes.filter((node) => !hasIncoming.has(node.id));

		if (rootNodes.length === 0 && nodes.length > 0) {
			rootNodes.push(nodes[0]);
		}

		let currentLevel = rootNodes.map((n) => n.id);
		while (currentLevel.length > 0) {
			levels.push([...currentLevel]);
			currentLevel.forEach((nodeId) => visited.add(nodeId));

			const nextLevel: string[] = [];
			currentLevel.forEach((nodeId) => {
				const connections = nodeConnections.get(nodeId) || [];
				connections.forEach((targetId) => {
					if (!visited.has(targetId) && !nextLevel.includes(targetId)) {
						nextLevel.push(targetId);
					}
				});
			});
			currentLevel = nextLevel;
		}

		const allLevelNodes = new Set(levels.flat());
		const remainingNodes = nodes.filter((node) => !allLevelNodes.has(node.id));
		if (remainingNodes.length > 0) {
			levels.push(remainingNodes.map((n) => n.id));
		}

		const levelHeight = dimensions.height / (levels.length + 1);
		levels.forEach((level, levelIndex) => {
			const y = levelHeight * (levelIndex + 1);
			const nodeWidth = dimensions.width / (level.length + 1);

			level.forEach((nodeId, nodeIndex) => {
				const x = nodeWidth * (nodeIndex + 1);
				nodePositionsRef.current.set(nodeId, { x, y });
			});
		});

		setLayoutKey((prev) => prev + 1);
	};

	useEffect(() => {
		if (onReorganizeLayout) {
			onReorganizeLayout.current = reorganizeLayout;
		}
		if (onArrangeAsTree) {
			onArrangeAsTree.current = arrangeAsTree;
		}
	}, [onReorganizeLayout, onArrangeAsTree]);

	return (
		<div className="relative w-full h-full">
			<canvas
				ref={canvasRef}
				width={dimensions.width}
				height={dimensions.height}
				className={`w-full h-full bg-white ${
					isDraggingNode
						? 'cursor-grabbing'
						: hoveredNode || hoveredExpandButton
						? 'cursor-pointer'
						: 'cursor-crosshair'
				}`}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
			/>

			{hoveredNode && (
				<NodeTooltip
					node={hoveredNode}
					mousePos={mousePos}
					onNodeSelection={onNodeSelection}
					selectedNodes={selectedNodes}
					onClose={() => setHoveredNode(null)}
					onReadMore={(node) => {
						setSelectedArticle(node);
						setShowModal(true);
					}}
				/>
			)}

			{showModal && selectedArticle && (
				<NodeModal
					node={selectedArticle}
					onClose={() => {
						setShowModal(false);
					}}
					onNodeSelection={onNodeSelection}
					selectedNodes={selectedNodes}
				/>
			)}
		</div>
	);
}
