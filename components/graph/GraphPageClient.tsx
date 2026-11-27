'use client';

import { PANEL_WIDTH, WIDE_STOPS_AT, PanelMaximizeButton, PanelRail, PanelSlot, widenOnDoubleClick } from '@/components/layout/PanelChrome';
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
	// Maximized, the chat covers the graph up to the search panel (or its rail)
	const leftCollapsed = useAppStore((state) => state.searchPanelCollapsed);

	// The search, filters and graph settings in the web address
	// (refresh, shared link, Back/Forward)
	useSearchFromUrl();
	useViewInUrl();

	return (
		<NetworkGraphProvider>
			<div data-page="graph" className="relative flex h-screen overflow-clip bg-background">
				{/* Search & filters, sliding to its rail when folded */}
				<PanelSlot open={!leftCollapsed} width={PANEL_WIDTH.left}>
					<SearchPanel />
				</PanelSlot>

				{/* Main Graph Area */}
				<div className="flex-1 relative h-screen overflow-clip">
					<div className="w-full h-full">
						<NetworkGraphCanvas />
					</div>
					<ColorLegend />
				</div>

				{/* Right Panel, or its thin rail when closed */}
				<PanelSlot open={!rightCollapsed} width={PANEL_WIDTH.right}>
				{rightCollapsed ? (
					<PanelRail side="right" name="analysis" onOpen={() => setRightCollapsed(false)} />
				) : (
				<div
					className={`${
						rightPanelExpanded ? `absolute inset-y-0 right-0 ${leftCollapsed ? WIDE_STOPS_AT.right.closed : WIDE_STOPS_AT.right.open} z-20 shadow-xl` : `${PANEL_WIDTH.right} shrink-0`
					} h-screen bg-card border-l border-sidebar-border overflow-clip flex flex-col`}>
					{/* Context | Chat | Clusters tabs are the header, like the search panel's */}
					<ContextManagement
						rightPanelExpanded={rightPanelExpanded}
						// One button, on the graph side: maximize over the graph, or restore (double-clicking the header does the same)
						headerStart={<PanelMaximizeButton name="analysis" wide={rightPanelExpanded} onClick={() => setRightPanelExpanded(!rightPanelExpanded)} />}
						headerProps={widenOnDoubleClick(rightPanelExpanded, () => setRightPanelExpanded(!rightPanelExpanded))}
					/>
				</div>
				)}
				</PanelSlot>
			</div>
		</NetworkGraphProvider>
	);
}
