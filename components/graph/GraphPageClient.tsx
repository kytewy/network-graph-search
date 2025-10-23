'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ColorLegend } from '@/components/network/ColorLegend';
import { NetworkGraphCanvas } from '@/components/network/NetworkGraphCanvas';
import { NetworkGraphProvider } from '@/lib/contexts/network-graph-context';
import { SearchPanel } from '@/components/search/SearchPanel';
import ContextManagement from '@/components/analysis/ContextManagement';
import { useAppStore } from '@/lib/stores/app-state';
import { setupErrorTracking } from '@/lib/utils/error-tracker';

export function GraphPageClient() {
	const rightPanelExpanded = useAppStore((state) => state.rightPanelExpanded);
	const setRightPanelExpanded = useAppStore(
		(state) => state.setRightPanelExpanded
	);

	// Setup error tracking on component mount
	useEffect(() => {
		console.log('🔧 [GraphPageClient] Setting up error tracking...');
		setupErrorTracking();
	}, []);

	return (
		<NetworkGraphProvider>
			<div className="flex h-screen overflow-hidden bg-background">
				{/* Sidebar - Unified Search & Filter Panel */}
				<SearchPanel />

				{/* Main Graph Area */}
				<div className="flex-1 relative h-screen overflow-hidden">
					<div className="w-full h-full">
						<NetworkGraphCanvas />
					</div>
					<ColorLegend />
				</div>

				{/* Right Panel */}
				<div
					className={`${
						rightPanelExpanded ? 'absolute right-0 top-0 left-96 z-10' : 'w-96'
					} h-screen bg-sidebar border-l border-sidebar-border overflow-y-auto [scrollbar-gutter:stable] transition-all duration-300 flex flex-col`}>
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
