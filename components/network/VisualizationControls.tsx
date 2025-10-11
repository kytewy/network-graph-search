'use client';

import {
	Check,
	Layers,
	Palette,
	Maximize2,
	Tag,
	Network,
} from 'lucide-react';
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
import { useNetworkGraph } from '@/lib/contexts/network-graph-context';

// No props needed as we'll use context
interface VisualizationControlsProps {}

export function VisualizationControls({}: VisualizationControlsProps) {
	// Get all the state and handlers from context
	const {
		layoutType: currentLayout,
		handleLayoutChange: onLayoutChange,
		colorMode: currentColorBy,
		setColorMode: onColorByChange,
		nodeSizeMode: currentSizeBy,
		setNodeSizeMode: onSizeByChange,
		clusterMode: currentClusterBy,
		setClusterMode: onClusterByChange,
		showLabels,
		setShowLabels: onShowLabelsChange,
		hasAiClusters,
	} = useNetworkGraph();

	// Layout options with descriptions
	const layoutOptions = [
		{
			id: 'forceDirected2d',
			name: 'Force Directed',
			description: 'Show me everything and how it relates',
			icon: <Maximize2 className="h-4 w-4 mr-2" />,
		},
		{
			id: 'concentric2d',
			name: 'Concentric',
			description: 'Show me by importance level',
			icon: <Layers className="h-4 w-4 mr-2" />,
		},
		{
			id: 'radialOut2d',
			name: 'Radial',
			description: 'Show me everything related to THIS topic',
			icon: <Palette className="h-4 w-4 mr-2" />,
		},
	];

	// Color by options
	const colorByOptions = [
		{ id: 'continent', name: 'Continent' },
		{ id: 'country', name: 'Country' },
		{ id: 'sourceType', name: 'Source Type' },
		{ id: 'similarityRange', name: 'Similarity Range' },
	];

	// Size by options
	const sizeByOptions = [
		{ id: 'none', name: 'None' },
		{ id: 'similarity', name: 'Similarity' },
		{ id: 'contentLength', name: 'Content Length' },
	];

	// Cluster by options
	const clusterByOptions = [
		{ id: 'none', name: 'None' },
		{ id: 'type', name: 'Type' },
		{ id: 'continent', name: 'Continent' },
		{ id: 'country', name: 'Country' },
		{ id: 'sourceType', name: 'Source Type' },
		...(hasAiClusters ? [{ id: 'ai_clusters', name: 'AI Clusters' }] : []),
	];

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
		<div className="flex items-center space-x-4 bg-card/80 backdrop-blur-sm rounded-md p-2 shadow-sm border border-border" style={{ position: 'relative', zIndex: 9999 }}>
			{/* Layout Dropdown */}
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" className="gap-2">
						<Layers className="h-4 w-4" />
						<span>Layout: {getCurrentLayoutName()}</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					{layoutOptions.map((layout) => (
						<DropdownMenuItem
							key={layout.id}
							onSelect={() => onLayoutChange(layout.id)}
							className="flex items-center justify-between">
							<div className="flex items-center">
								{layout.icon}
								<div className="ml-2">
									<p className="font-medium">{layout.name}</p>
									<p className="text-xs text-muted-foreground">
										{layout.description}
									</p>
								</div>
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
							<span>Color: {getCurrentColorByName()}</span>
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
							<span>Size: {getCurrentSizeByName()}</span>
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
											disabled={currentLayout !== 'forceDirected2d'}>
											<Network className="h-4 w-4" />
											<span>Cluster: {getCurrentClusterByName()}</span>
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
						{currentLayout !== 'forceDirected2d' && (
							<TooltipContent>
								<p>Clustering is only available for Force Directed layout</p>
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
					<Label htmlFor="show-labels" className="text-sm cursor-pointer">
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
