'use client';

import { Button } from '@/components/ui/button';
import { ColorLegend } from '@/components/network/ColorLegend';
import { NetworkGraphCanvas } from '@/components/network/NetworkGraphCanvas';
import { NetworkGraphProvider } from '@/lib/contexts/network-graph-context';
import { SearchInput } from '@/components/search/SearchInput';
import { SimilarityHistogram } from '@/components/search/SimilarityHistogram';
import FilterPanel from '@/components/filters/FilterPanel';
import ContextManagement from '@/components/analysis/ContextManagement';
import { useAppStore } from '@/lib/stores/app-state';

export default function NetworkGraphApp() {
	// Use app-state's pre-filtered results
	const filteredResults = useAppStore((state) => state.filteredResults);
	const rightPanelExpanded = useAppStore((state) => state.rightPanelExpanded);
	const setRightPanelExpanded = useAppStore(
		(state) => state.setRightPanelExpanded
	);
	// Use filtered results from app-state (already filtered by applyFilters())
	const filteredNodes = filteredResults;

	return (
		<NetworkGraphProvider>
		<div className="flex h-screen overflow-hidden bg-background">
			{/* Sidebar */}
			<div className="w-96 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
				<div className="space-y-6">
					{/* Header */}
					<div>
						<h1 className="text-2xl font-bold text-sidebar-foreground mb-2">
							Graph Explorer
						</h1>
						<p className="text-sm text-sidebar-foreground/70">
							Search and filter network connections
						</p>
					</div>

					<SearchInput />

					<SimilarityHistogram />

					<FilterPanel />
				</div>
			</div>

			{/* Main Graph Area */}
			<div className="flex-1 relative h-screen overflow-hidden">
				<div className="w-full h-full">
					<NetworkGraphCanvas />
				</div>
				<ColorLegend filteredNodes={filteredNodes} />
			</div>

			{/* Right Panel */}
			<div
				className={`${
					rightPanelExpanded ? 'absolute right-0 top-0 left-96 z-10' : 'w-80'
				} h-screen bg-sidebar border-l border-sidebar-border overflow-y-auto transition-all duration-300 flex flex-col`}>
				{/* Expand/Collapse Button */}
				<div className="flex justify-start p-2 border-b border-sidebar-border">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
						className="h-6 px-2 text-sidebar-foreground/70 hover:text-sidebar-foreground">
						{rightPanelExpanded ? '»' : '«'}
					</Button>
				</div>

				<div className="p-6 flex-1">
					<div className="space-y-6">
						<div className="flex items-center justify-between mb-3">
							<div>
								<h3 className="text-2xl font-bold text-sidebar-foreground">
									Analysis Workspace
								</h3>
								<p className="text-sm text-sidebar-foreground/70 mt-1"></p>
							</div>
						</div>

						{/* Context Management */}
						<ContextManagement rightPanelExpanded={rightPanelExpanded} />
					</div>
				</div>
			</div>
		</div>
		</NetworkGraphProvider>
	);
}
