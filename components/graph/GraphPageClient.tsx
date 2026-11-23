'use client';

import { PANEL_BUTTON, PANEL_HEADER, PanelCloseButton, PanelRail } from '@/components/layout/PanelChrome';
import { ColorLegend } from '@/components/network/ColorLegend';
import { NetworkGraphCanvas } from '@/components/network/NetworkGraphCanvas';
import { NetworkGraphProvider } from '@/lib/contexts/network-graph-context';
import { SearchPanel } from '@/components/search/SearchPanel';
import ContextManagement from '@/components/analysis/ContextManagement';
import { useAppStore } from '@/lib/stores/app-state';
import { useSearchFromUrl } from '@/hooks/use-url-search';
import { useViewInUrl } from '@/hooks/use-url-view';

export function GraphPageClient() {
	const rightPanelExpanded = useAppStore((state) => state.rightPanelExpanded);
	const setRightPanelExpanded = useAppStore(
		(state) => state.setRightPanelExpanded
	);
	const rightCollapsed = useAppStore((state) => state.rightPanelCollapsed);
	const setRightCollapsed = useAppStore((state) => state.setRightPanelCollapsed);
	// The wide view stops at the search panel, which may be folded to its rail
	const leftCollapsed = useAppStore((state) => state.searchPanelCollapsed);

	// The search, filters and graph settings in the web address
	// (refresh, shared link, Back/Forward)
	useSearchFromUrl();
	useViewInUrl();

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

				{/* Right Panel, or its thin rail when closed */}
				{rightCollapsed ? (
					<PanelRail side="right" name="analysis" onOpen={() => setRightCollapsed(false)} />
				) : (
				<div
					className={`${
						rightPanelExpanded ? `absolute right-0 top-0 ${leftCollapsed ? 'left-10' : 'left-96'} z-10` : 'w-96 shrink-0'
					} h-screen bg-sidebar border-l border-sidebar-border overflow-y-auto [scrollbar-gutter:stable] transition-all duration-300 flex flex-col`}>
					{/* Same header as the search panel: widen on the inside, close on the outside */}
					<div data-panel-header="right" className={`${PANEL_HEADER} sticky top-0 z-10 bg-sidebar`}>
						<button
							type="button"
							onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
							aria-label={rightPanelExpanded ? 'Collapse analysis panel' : 'Expand analysis panel'}
							title={rightPanelExpanded ? 'Narrow' : 'Widen'}
							className={PANEL_BUTTON}>
							{rightPanelExpanded ? '»' : '«'}
						</button>
						<span className="ml-auto">
							<PanelCloseButton side="right" name="analysis" onClick={() => setRightCollapsed(true)} />
						</span>
					</div>

					<div className="p-6 flex-1">
						{/* Centered container for entire analysis workspace */}
						<div className="mx-auto max-w-5xl w-full space-y-6">
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
				)}
			</div>
		</NetworkGraphProvider>
	);
}
