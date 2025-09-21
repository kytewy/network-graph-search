'use client';

import { useState, useRef, useEffect } from 'react';
import {
	Check,
	ChevronDown,
	Layers,
	Palette,
	Maximize2,
	Tag,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface VisualizationControlsProps {
	currentLayout: string;
	onLayoutChange: (layout: string) => void;
	currentColorBy?: string;
	onColorByChange?: (colorBy: string) => void;
	currentSizeBy?: string;
	onSizeByChange?: (sizeBy: string) => void;
	showLabels?: boolean;
	onShowLabelsChange?: (show: boolean) => void;
	reorganizeLayoutRef?: React.MutableRefObject<(() => void) | null>;
	arrangeAsTreeRef?: React.MutableRefObject<(() => void) | null>;
	hasApiKey?: boolean;
}

export function VisualizationControls({
	currentLayout,
	onLayoutChange,
	currentColorBy = 'continent',
	onColorByChange,
	currentSizeBy = 'none',
	onSizeByChange,
	showLabels = true,
	onShowLabelsChange,
	reorganizeLayoutRef,
	arrangeAsTreeRef,
	hasApiKey = true,
}: VisualizationControlsProps) {
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

	// State for dropdown visibility
	const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
	const [showColorDropdown, setShowColorDropdown] = useState(false);
	const [showSizeDropdown, setShowSizeDropdown] = useState(false);

	// Refs for dropdown containers
	const layoutDropdownRef = useRef<HTMLDivElement>(null);
	const colorDropdownRef = useRef<HTMLDivElement>(null);
	const sizeDropdownRef = useRef<HTMLDivElement>(null);

	// Handle click outside to close dropdown
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				layoutDropdownRef.current &&
				!layoutDropdownRef.current.contains(event.target as Node)
			) {
				setShowLayoutDropdown(false);
			}
			if (
				colorDropdownRef.current &&
				!colorDropdownRef.current.contains(event.target as Node)
			) {
				setShowColorDropdown(false);
			}
			if (
				sizeDropdownRef.current &&
				!sizeDropdownRef.current.contains(event.target as Node)
			) {
				setShowSizeDropdown(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div
			className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-md p-2 shadow-sm z-50"
			style={{ position: 'relative', zIndex: 9999 }}>
			{/* Layout Control */}
			<div className="flex items-center">
				<div className="relative" ref={layoutDropdownRef}>
					<button
						className="flex items-center gap-2 h-8 px-3 border rounded-md bg-white hover:bg-gray-100"
						onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}>
						<Layers className="h-4 w-4" />
						<span>Layout: {getCurrentLayoutName()}</span>
						<ChevronDown className="h-3 w-3 opacity-50" />
					</button>

					{showLayoutDropdown && (
						<div className="absolute top-full left-0 mt-1 bg-white shadow-md rounded-md p-2 z-50 w-56">
							{layoutOptions.map((layout) => (
								<button
									key={layout.id}
									className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-sm text-left"
									onClick={() => {
										onLayoutChange(layout.id);
										setShowLayoutDropdown(false);
									}}>
									<div className="flex items-center">
										{layout.icon}
										<div className="ml-2">
											<p>{layout.name}</p>
											<p className="text-xs text-gray-500">
												{layout.description}
											</p>
										</div>
									</div>
									{currentLayout === layout.id && <Check className="h-4 w-4" />}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			<Separator orientation="vertical" className="h-6" />

			{/* Color By Control */}
			{onColorByChange && (
				<div className="flex items-center">
					<div className="relative" ref={colorDropdownRef}>
						<button
							className="flex items-center gap-2 h-8 px-3 border rounded-md bg-white hover:bg-gray-100"
							onClick={() => setShowColorDropdown(!showColorDropdown)}>
							<Palette className="h-4 w-4" />
							<span>Color: {getCurrentColorByName()}</span>
							<ChevronDown className="h-3 w-3 opacity-50" />
						</button>

						{showColorDropdown && (
							<div className="absolute top-full left-0 mt-1 bg-white shadow-md rounded-md p-2 z-50 w-56">
								{colorByOptions.map((option) => (
									<button
										key={option.id}
										className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-sm text-left"
										onClick={() => {
											onColorByChange(option.id);
											setShowColorDropdown(false);
										}}>
										<span>{option.name}</span>
										{currentColorBy === option.id && (
											<Check className="h-4 w-4" />
										)}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			<Separator orientation="vertical" className="h-6" />

			{/* Size By Control */}
			{onSizeByChange && (
				<div className="flex items-center">
					<div className="relative" ref={sizeDropdownRef}>
						<button
							className="flex items-center gap-2 h-8 px-3 border rounded-md bg-white hover:bg-gray-100"
							onClick={() => setShowSizeDropdown(!showSizeDropdown)}>
							<Maximize2 className="h-4 w-4" />
							<span>Size: {getCurrentSizeByName()}</span>
							<ChevronDown className="h-3 w-3 opacity-50" />
						</button>

						{showSizeDropdown && (
							<div className="absolute top-full left-0 mt-1 bg-white shadow-md rounded-md p-2 z-50 w-56">
								{sizeByOptions.map((option) => (
									<button
										key={option.id}
										className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-sm text-left"
										onClick={() => {
											onSizeByChange(option.id);
											setShowSizeDropdown(false);
										}}>
										<span>{option.name}</span>
										{currentSizeBy === option.id && (
											<Check className="h-4 w-4" />
										)}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			<Separator orientation="vertical" className="h-6" />

			{/* Show Labels Control */}
			{onShowLabelsChange && (
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-2">
						<Tag className="h-4 w-4" />
						<label htmlFor="show-labels" className="text-sm cursor-pointer">
							Labels
						</label>
						<div 
							className={`w-8 h-4 rounded-full cursor-pointer transition-colors ${showLabels ? 'bg-purple-600' : 'bg-gray-300'}`}
							onClick={() => onShowLabelsChange(!showLabels)}
						>
							<div 
								className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${showLabels ? 'translate-x-4' : 'translate-x-1'}`}
								style={{ marginTop: '2px' }}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
