'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-state';
import {
	nodeColors,
	colorMappings,
	getColorByMode,
	getSimilarityColor,
} from '@/lib/theme/colors';

export function ColorLegend() {
	const [isClient, setIsClient] = useState(false);

	// Get state from app store - MUST be called before conditional returns
	const colorMode = useAppStore((state) => state.colorMode);
	const nodeSizeMode = useAppStore((state) => state.nodeSizeMode);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return null; // Don't render anything during SSR
	}

	const getColorLegendData = () => {
		switch (colorMode) {
			case 'sourceType':
				return [
					{ label: 'article', color: '#4f46e5' },
					{ label: 'document', color: '#10b981' },
					{ label: 'webpage', color: '#f59e0b' },
					{ label: 'pdf', color: '#ef4444' },
					{ label: 'other', color: '#a855f7' },
				];

			case 'continent':
				return [
					{ label: 'North America', color: '#4f46e5' },
					{ label: 'Europe', color: '#10b981' },
					{ label: 'Asia', color: '#f59e0b' },
					{ label: 'Africa', color: '#ef4444' },
					{ label: 'South America', color: '#a855f7' },
					{ label: 'Unknown', color: '#6b7280' },
				];

			case 'country':
				// Specific colors for important countries, hash for others
				return [
					{ label: 'USA', color: '#1e40af' }, // Dark blue
					{ label: 'Canada', color: '#ef4444' }, // Red
					{ label: 'Europian Union', color: '#60a5fa' }, // Light blue
					{ label: 'Other', color: '#6b7280' }, // Gray
				];

			case 'documentType':
				return [
					{ label: 'article', color: '#4f46e5' },
					{ label: 'document', color: '#10b981' },
					{ label: 'webpage', color: '#f59e0b' },
					{ label: 'pdf', color: '#ef4444' },
					{ label: 'other', color: '#a855f7' },
				];

			case 'similarityRange':
				return [
					{ label: 'Very High (81-100%)', color: '#22c55e' }, // Green
					{ label: 'High (61-80%)', color: '#84cc16' }, // Light green
					{ label: 'Medium (41-60%)', color: '#eab308' }, // Yellow
					{ label: 'Low (20-40%)', color: '#f97316' }, // Orange
					{ label: 'Very Low (0-19%)', color: '#ef4444' }, // Red
				];

			default:
				return [];
		}
	};

	return (
		<div className="absolute top-4 left-4 space-y-4 pointer-events-none">
			{/* Color Legend */}
			<div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
				<div className="text-sm font-medium text-gray-700 mb-2">
					Color by:{' '}
					{colorMode === 'sourceType'
						? 'Source Type'
						: colorMode === 'continent'
						? 'Continent'
						: colorMode === 'similarityRange'
						? 'Similarity Range'
						: colorMode === 'documentType'
						? 'Document Type'
						: 'Country'}
				</div>
				<div className="space-y-1">
					{getColorLegendData().map((item, index) => (
						<div key={index} className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded-full flex-shrink-0"
								style={{ backgroundColor: item.color }}
							/>
							<span className="text-xs text-gray-600">{item.label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Size Legend */}
			{nodeSizeMode !== 'none' && (
				<div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
					<div className="text-sm font-medium text-gray-700 mb-2">
						Size by:{' '}
						{nodeSizeMode === 'contentLength'
							? 'Content Length'
							: nodeSizeMode === 'summaryLength'
							? 'Summary Length'
							: 'Similarity'}
					</div>
					<div className="space-y-1">
						{nodeSizeMode === 'contentLength' && (
							<>
								<div className="flex items-center gap-2">
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">
										Small (Under 500 chars)
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">
										Medium (501-1000 chars)
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-4 h-4 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">
										Large (1000+ chars)
									</span>
								</div>
							</>
						)}
						{nodeSizeMode === 'summaryLength' && (
							<>
								<div className="flex items-center gap-2">
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">
										Small (0-15 chars)
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">
										Medium (15-25 chars)
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-4 h-4 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">
										Large (25+ chars)
									</span>
								</div>
							</>
						)}
						{nodeSizeMode === 'similarity' && (
							<>
								<div className="flex items-center gap-2">
									<div
										className="w-1 h-1 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">
										Very Low (0-19%)
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">Low (20-40%)</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">Medium (41-60%)</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-4 h-4 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">High (61-80%)</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className="w-5 h-5 rounded-full"
										style={{ backgroundColor: nodeColors.neutral }}
									/>
									<span className="text-xs text-gray-600">
										Very High (81-100%)
									</span>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
