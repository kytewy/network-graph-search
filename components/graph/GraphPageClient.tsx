'use client';

import { PANEL_WIDTH, WIDE_STOPS_AT, PanelCloseButton, PanelRail, PanelWidenButton } from '@/components/layout/PanelChrome';
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
						rightPanelExpanded ? `absolute right-0 top-0 ${leftCollapsed ? WIDE_STOPS_AT.right.closed : WIDE_STOPS_AT.right.open} z-10` : `${PANEL_WIDTH.right} shrink-0`
					} h-screen bg-sidebar border-l border-sidebar-border overflow-y-auto [scrollbar-gutter:stable] transition-all duration-300 flex flex-col`}>
					{/* Context | Chat | Clusters tabs are the header, like the search panel's */}
					<ContextManagement
						rightPanelExpanded={rightPanelExpanded}
						headerStart={
							<PanelWidenButton side="right" name="analysis" wide={rightPanelExpanded} onClick={() => setRightPanelExpanded(!rightPanelExpanded)} />
						}
						headerEnd={<PanelCloseButton side="right" name="analysis" onClick={() => setRightCollapsed(true)} />}
					/>
				</div>
				)}
			</div>
		</NetworkGraphProvider>
	);
}
