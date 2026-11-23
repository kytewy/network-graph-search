'use client';

import { CLUSTER_MODES, COLOR_MODES, SIZE_MODES } from '@/lib/config/view-modes';
import { Check, Layers, Palette, Maximize2, Tag, Network } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/lib/stores/app-state';
import { useGraphLayout } from '@/hooks/use-graph-layout';
import { useHasAiClusters } from '@/hooks/use-ai-clusters';

// No props needed as we'll use context
interface VisualizationControlsProps {}

export function VisualizationControls({}: VisualizationControlsProps) {
	// Settings straight from the store (one shallow read), layout from its hook
	const { layoutType: currentLayout, handleLayoutChange: onLayoutChange } = useGraphLayout();
	const hasAiClusters = useHasAiClusters();
	const {
		currentColorBy,
		onColorByChange,
		currentSizeBy,
		onSizeByChange,
		currentClusterBy,
		onClusterByChange,
		showLabels,
		onShowLabelsChange,
	} = useAppStore(
		useShallow((s) => ({
			currentColorBy: s.colorMode,
			onColorByChange: s.setColorMode,
			currentSizeBy: s.nodeSizeMode,
			onSizeByChange: s.setNodeSizeMode,
			currentClusterBy: s.clusterMode,
			onClusterByChange: s.setClusterMode,
			showLabels: s.showLabels,
			onShowLabelsChange: s.setShowLabels,
		}))
	);

	// Layout options with descriptions
	const layoutOptions = [
		// Force-based layouts
		{
			id: 'forceDirected2d',
			name: 'Force Directed',
			description: 'Physics-based natural spacing',
		},
		// Radial layout
		{
			id: 'radialOut2d',
			name: 'Radial Out',
			description: 'Radiating from center',
		},
		// Circular
		{
			id: 'circular2d',
			name: 'Circular',
			description: 'Nodes in a circle',
		},
		// Tree layouts
		{
			id: 'treeTd2d',
			name: 'Tree Top-Down',
			description: 'Hierarchical tree from top',
		},
		{
			id: 'treeLr2d',
			name: 'Tree Left-Right',
			description: 'Hierarchical tree from left',
		},
	];

	// Options come from the one list of view modes (lib/config/view-modes.ts)
	const toOption = (m: { id: string; label: string }) => ({ id: m.id, name: m.label });
	const colorByOptions = COLOR_MODES.map(toOption);
	const sizeByOptions = SIZE_MODES.filter((m) => m.inControls).map(toOption);
	const clusterByOptions = CLUSTER_MODES.filter((m) => !m.needsAiClusters || hasAiClusters).map(toOption);

	// Get display name for current layout
	const getCurrentLayoutName = () => {
		const layout = layoutOptions.find((l) => l.id === currentLayout);
		return layout ? layout.name : 'Force Directed';
	};

	// Get display name for current color by
	const getCurrentColorByName = () => {
		const colorBy = colorByOptions.find((c) => c.id === currentColorBy);
		return colorBy ? colorBy.name : 'Continent';
	};

	// Get display name for current size by
	const getCurrentSizeByName = () => {
		const sizeBy = sizeByOptions.find((s) => s.id === currentSizeBy);
		return sizeBy ? sizeBy.name : 'None';
	};

	// Get display name for current cluster by
	const getCurrentClusterByName = () => {
		const clusterBy = clusterByOptions.find((c) => c.id === currentClusterBy);
		return clusterBy ? clusterBy.name : 'None';
	};

	return (
		<div
			className="pointer-events-auto flex flex-wrap items-center justify-end gap-2 bg-card/80 backdrop-blur-sm rounded-md p-2 shadow-sm border border-border"
			style={{ position: 'relative', zIndex: 9999 }}>
			{/* Layout Dropdown */}
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" className="gap-2">
						<Layers className="h-4 w-4" />
						<span className="sr-only @3xl:not-sr-only">Layout: {getCurrentLayoutName()}</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					{layoutOptions.map((layout) => (
						<DropdownMenuItem
							key={layout.id}
							onSelect={() => onLayoutChange(layout.id)}
							className="flex items-center justify-between">
							<div>
								<p className="font-medium">{layout.name}</p>
								<p className="text-xs text-muted-foreground">
									{layout.description}
								</p>
							</div>
							{currentLayout === layout.id && (
								<Check className="h-4 w-4 text-primary" />
							)}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<Separator orientation="vertical" className="h-6" />

			{/* Color By Dropdown */}
			{onColorByChange && (
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="gap-2">
							<Palette className="h-4 w-4" />
							<span className="sr-only @3xl:not-sr-only">Color: {getCurrentColorByName()}</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{colorByOptions.map((option) => (
							<DropdownMenuItem
								key={option.id}
								onSelect={() => onColorByChange(option.id as any)}
								className="flex items-center justify-between">
								<span>{option.name}</span>
								{currentColorBy === option.id && (
									<Check className="h-4 w-4 text-primary" />
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			)}

			<Separator orientation="vertical" className="h-6" />

			{/* Size By Dropdown */}
			{onSizeByChange && (
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="gap-2">
							<Maximize2 className="h-4 w-4" />
							<span className="sr-only @3xl:not-sr-only">Size: {getCurrentSizeByName()}</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{sizeByOptions.map((option) => (
							<DropdownMenuItem
								key={option.id}
								onSelect={() => onSizeByChange(option.id as any)}
								className="flex items-center justify-between">
								<span>{option.name}</span>
								{currentSizeBy === option.id && (
									<Check className="h-4 w-4 text-primary" />
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			)}

			<Separator orientation="vertical" className="h-6" />

			{/* Cluster By Dropdown */}
			{onClusterByChange && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div>
								<DropdownMenu modal={false}>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="gap-2"
											disabled={
												currentLayout !== 'forceDirected2d' &&
												currentLayout !== 'forceatlas2'
											}>
											<Network className="h-4 w-4" />
											<span className="sr-only @3xl:not-sr-only">Cluster: {getCurrentClusterByName()}</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{clusterByOptions.map((option) => (
											<DropdownMenuItem
												key={option.id}
												onSelect={() => onClusterByChange(option.id as any)}
												className="flex items-center justify-between">
												<span>{option.name}</span>
												{currentClusterBy === option.id && (
													<Check className="h-4 w-4 text-primary" />
												)}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</TooltipTrigger>
						{currentLayout !== 'forceDirected2d' &&
						currentLayout !== 'forceatlas2' && (
							<TooltipContent>
								<p>Clustering is only available for force-directed layouts</p>
							</TooltipContent>
						)}
					</Tooltip>
				</TooltipProvider>
			)}

			<Separator orientation="vertical" className="h-6" />

			{/* Labels Toggle */}
			{onShowLabelsChange && (
				<div className="flex items-center gap-2">
					<Tag className="h-4 w-4" />
					<Label htmlFor="show-labels" className="text-sm cursor-pointer sr-only @3xl:not-sr-only">
						Labels
					</Label>
					<Switch
						id="show-labels"
						checked={showLabels}
						onCheckedChange={onShowLabelsChange}
					/>
				</div>
			)}
		</div>
	);
}
