/**
 * "Analyze in a new chat": starts a chat with exactly these documents and
 * brings the Chat tab into view (the graph menus and the lasso use this).
 */
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';
import type { Node } from '@/lib/config/types';

/** Asks the analysis panel to show Chat */
export const OPEN_CHAT_EVENT = 'panel:open-chat';

export function analyzeInNewChat(name: string, nodes: readonly Node[]): string {
	const id = useContextStore.getState().newChat(name, [...nodes] as never);
	useAppStore.getState().setRightPanelCollapsed(false);
	window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
	return id;
}
