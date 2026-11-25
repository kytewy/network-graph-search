import { analyzeInNewChat, CLUSTER_CHAT_EVENT, clusterInNewChat, OPEN_CHAT_EVENT } from '@/lib/chat/new-chat';
import { useAppStore } from '@/lib/stores/app-state';
import { useContextStore } from '@/lib/stores/context-store';

describe('analyzeInNewChat: a chat about exactly what you pointed at', () => {
	it('starts a named chat with those documents, opens the panel and asks for the Chat tab', () => {
		useContextStore.getState().clearChatConversations();
		useContextStore.setState({ contextNodes: [{ id: 'other' } as any] });
		useAppStore.getState().setRightPanelCollapsed(true);
		const heard = vi.fn();
		window.addEventListener(OPEN_CHAT_EVENT, heard);

		analyzeInNewChat('Cluster: High-risk obligations', [{ id: 'a' } as any, { id: 'b' } as any]);

		const s = useContextStore.getState();
		expect(s.chats.at(-1)!.name).toBe('Cluster: High-risk obligations');
		expect(s.activeChatId).toBe(s.chats.at(-1)!.id);
		expect(s.contextNodes.map((n) => n.id)).toEqual(['a', 'b']);
		expect(useAppStore.getState().rightPanelCollapsed).toBe(false);
		expect(heard).toHaveBeenCalledTimes(1);
		window.removeEventListener(OPEN_CHAT_EVENT, heard);
	});

	it('Cluster these: a chat with just those documents, and asks for Clusters to run', () => {
		const heard = vi.fn();
		window.addEventListener(CLUSTER_CHAT_EVENT, heard);
		clusterInNewChat('Selection: 2 documents', [{ id: 'x' } as any, { id: 'y' } as any]);
		expect(useContextStore.getState().contextNodes.map((n) => n.id)).toEqual(['x', 'y']);
		expect(heard).toHaveBeenCalledTimes(1);
		window.removeEventListener(CLUSTER_CHAT_EVENT, heard);
	});
});
