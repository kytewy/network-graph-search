import { chatTurns, MAIN_CHAT, useContextStore } from '@/lib/stores/context-store';

const ask = (id: string, prompt: string) =>
	useContextStore.getState().addChatConversation({ id, prompt, response: 'A', timestamp: new Date(), status: 'done' });

describe('several chats', () => {
	beforeEach(() => useContextStore.getState().clearChatConversations());

	it('starts with the main chat, and old questions without a chat belong to it', () => {
		expect(useContextStore.getState().chats).toEqual([MAIN_CHAT]);
		expect(chatTurns([{ id: '1', prompt: 'q', response: '', timestamp: new Date() }], MAIN_CHAT.id)).toHaveLength(1);
	});

	it('keeps each chat’s questions apart and names a new chat after its first question', () => {
		ask('1', 'In the main chat');
		const id = useContextStore.getState().newChat();
		ask('2', 'What obligations does the high-risk cluster set for providers of AI systems?');
		ask('3', 'And for deployers?');
		const s = useContextStore.getState();
		expect(chatTurns(s.chatConversations, MAIN_CHAT.id).map((t) => t.id)).toEqual(['1']);
		expect(chatTurns(s.chatConversations, id).map((t) => t.id)).toEqual(['2', '3']);
		expect(s.chats.find((c) => c.id === id)!.name).toBe('What obligations does the high-risk clu…');
		// The AI's name replaces it; a name given by hand never would
		useContextStore.getState().nameChatAuto(id, 'High-risk provider obligations');
		expect(useContextStore.getState().chats.find((c) => c.id === id)!.name).toBe('High-risk provider obligations');
	});

	it('flips between chats and deletes one, opening the one before it', () => {
		const a = useContextStore.getState().newChat();
		ask('1', 'Question in A');
		const b = useContextStore.getState().newChat();
		useContextStore.getState().selectChat(a);
		expect(useContextStore.getState().activeChatId).toBe(a);
		useContextStore.getState().selectChat(b);
		useContextStore.getState().deleteChat(b);
		expect(useContextStore.getState().activeChatId).toBe(a);
		useContextStore.getState().deleteChat(a);
		const s = useContextStore.getState();
		expect(s.activeChatId).toBe(MAIN_CHAT.id);
		expect(s.chatConversations).toHaveLength(0);
	});

	it('only empties the main chat, never removes it', () => {
		ask('1', 'Main question');
		useContextStore.getState().deleteChat(MAIN_CHAT.id);
		const s = useContextStore.getState();
		expect(s.chats).toEqual([MAIN_CHAT]);
		expect(s.chatConversations).toHaveLength(0);
	});
});
