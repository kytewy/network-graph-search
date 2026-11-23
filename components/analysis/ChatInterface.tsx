'use client';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp, BookmarkPlus, Copy, Download, Pencil, Plus, RotateCcw, Square, ThumbsDown, ThumbsUp } from 'lucide-react';
import { analyzeNodes } from '@/lib/api/analysis-client';
import { queryClient } from '@/lib/api/query-client';
import { ApiError, RETRY, shouldRetry } from '@/lib/api/http';
import { chatMemory, CHAT_LIMITS } from '@/lib/contracts/analysis';
import { useContextStore, type ChatConversation } from '@/lib/stores/context-store';
import { CHAT_PLACEHOLDERS, PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { useSavedPrompts } from '@/lib/stores/saved-prompts';
import { SavedPromptsDialog } from './SavedPromptsDialog';
import { reportError } from '@/lib/observability/capture-client';
import { toAnalysisNode } from '@/lib/utils/llm-tokens';
import { debugLog } from '@/lib/utils/debug';

interface ChatInterfaceProps {
	safeSelectedNodes: string[];
	networkState: any;
	filterState: any;
	rightPanelExpanded: boolean;
	selectedNodesSummary: any;
	/** One line on what the AI will receive (documents and tokens) */
	contextSummary?: ReactNode;
}

/** Saved prompts shown as chips in the box; the rest are behind + */
const CHIPS_SHOWN = 3;

const STOPPED = '_Stopped._';
/** Tallest the question box grows before it scrolls */
const MAX_BOX_PX = 200;
const FAILED = 'Sorry, something went wrong while analysing the documents. Try again.';

/** A plain-text copy of one question and answer, with the filters that were on */
function downloadTurn(turn: ChatConversation, filterState: any, nodeIds: string[]) {
	const filters = [
		filterState?.selectedContinents?.length && `Continents: ${filterState.selectedContinents.join(', ')}`,
		filterState?.selectedCountries?.length && `Countries: ${filterState.selectedCountries.join(', ')}`,
		filterState?.selectedPublishers?.length && `Publishers: ${filterState.selectedPublishers.join(', ')}`,
	].filter(Boolean);
	const text = [
		`Export date: ${new Date().toLocaleString()}`,
		`Prompt: ${turn.prompt}`,
		`Active filters: ${filters.join(' | ') || 'None'}`,
		`Documents: ${nodeIds.join(', ') || 'None'}`,
		'',
		turn.response,
	].join('\n\n');
	const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
	const a = Object.assign(document.createElement('a'), { href: url, download: `network-analysis-${Date.now()}.txt` });
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * The chat: questions about the documents in context. Laid out like a chat
 * app (newest at the bottom, box underneath); follow-ups remember the last
 * few turns, and Stop really cancels.
 */
export default function ChatInterface({ safeSelectedNodes, filterState, rightPanelExpanded, contextSummary }: ChatInterfaceProps) {
	const [chatInput, setChatInput] = useState('');
	const savedPrompts = useSavedPrompts((s) => s.prompts);
	const [promptsOpen, setPromptsOpen] = useState(false);
	// A chat question being saved as a prompt (opens the window on its form)
	const [saveText, setSaveText] = useState<string | null>(null);
	const openPrompts = (text: string | null = null) => {
		setSaveText(text);
		setPromptsOpen(true);
	};
	const conversations = useContextStore((s) => s.chatConversations);
	const contextNodes = useContextStore((s) => s.contextNodes);
	const addTurn = useContextStore((s) => s.addChatConversation);
	const updateTurn = useContextStore((s) => s.updateChatConversation);

	const inputRef = useRef<HTMLTextAreaElement>(null);
	const endRef = useRef<HTMLDivElement>(null);
	const stopRef = useRef<AbortController | null>(null);
	const [thinking, setThinking] = useState(false);

	// A network blip is retried once; a stopped request never is
	const analyze = useMutation({ mutationFn: analyzeNodes, retry: shouldRetry, retryDelay: RETRY.DELAY_MS }, queryClient);

	// Only finished answers are remembered for follow-ups
	const finished = conversations.filter((c) => (c.status ?? 'done') === 'done');
	const memory = chatMemory(finished);

	// The AI needs at least one document and takes up to the limit (the line above the box says which)
	const canAsk = contextNodes.length > 0 && contextNodes.length <= PROMPT_CONFIG.MAX_NODES_PER_REQUEST;

	const send = useCallback(
		async (text?: string) => {
			const prompt = (text ?? chatInput).trim();
			if (!prompt || thinking || !canAsk) return;
			const id = Date.now().toString();
			addTurn({ id, prompt, response: '', timestamp: new Date(), status: 'thinking' });
			setChatInput('');
			setThinking(true);
			const controller = new AbortController();
			stopRef.current = controller;
			try {
				const { summary } = await analyze.mutateAsync({
					nodes: contextNodes.map(toAnalysisNode),
					customPrompt: prompt,
					history: memory,
					signal: controller.signal,
				});
				updateTurn(id, { response: summary, status: 'done' });
			} catch (error) {
				if (controller.signal.aborted) {
					updateTurn(id, { response: STOPPED, status: 'stopped' });
				} else {
					reportError('chat', error);
					// A request the server turned down says why; anything else gets the general message
					const why = error instanceof ApiError && error.status === 400 ? `Couldn't ask: ${error.message}.` : FAILED;
					updateTurn(id, { response: why, status: 'failed' });
				}
			} finally {
				stopRef.current = null;
				setThinking(false);
			}
		},
		[chatInput, thinking, canAsk, contextNodes, memory, addTurn, updateTurn, analyze]
	);

	const stop = () => stopRef.current?.abort();

	/** Puts a saved prompt in the box, ready to edit or send */
	const fillBox = (text: string) => {
		setChatInput(text);
		requestAnimationFrame(() => inputRef.current?.focus());
	};

	// The box grows upward with what you type, up to about 8 lines, then scrolls inside
	useEffect(() => {
		const box = inputRef.current;
		if (!box) return;
		box.style.height = 'auto';
		box.style.height = `${Math.min(box.scrollHeight, MAX_BOX_PX)}px`;
		box.style.overflowY = box.scrollHeight > MAX_BOX_PX ? 'auto' : 'hidden';
	}, [chatInput]);

	// The newest message stays in view
	useEffect(() => {
		endRef.current?.scrollIntoView?.({ block: 'end' });
	}, [conversations.length, thinking]);

	// Clustering can ask the chat a question ("Analyze this cluster")
	useEffect(() => {
		const onSend = (e: Event) => {
			const { message, nodes } = (e as CustomEvent).detail;
			debugLog('[Chat] cluster question for', nodes?.length || 0, 'documents');
			send(message);
		};
		window.addEventListener('chat:send', onSend);
		return () => window.removeEventListener('chat:send', onSend);
	}, [send]);

	const tool = 'h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50';

	return (
		<div
			data-testid="chat"
			// Wide: a comfortable reading column in the middle instead of edge to edge
			className={`flex flex-col min-h-[calc(100vh-5rem)] ${rightPanelExpanded ? 'w-full max-w-3xl mx-auto px-6' : ''}`}>
			{/* Messages, oldest first */}
			<div className="flex-1 space-y-4 pb-4">
				{conversations.length === 0 && (
					<p className="pt-8 text-center text-sm text-muted-foreground">
						Ask about the documents in context. Follow-up questions remember the last {CHAT_LIMITS.MEMORY_TURNS} answers.
					</p>
				)}
				{conversations.map((turn) => (
					<div key={turn.id} className="space-y-2" data-chat-turn>
						<div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary/10 px-4 py-2 text-sm whitespace-pre-wrap" data-role="user">
							{turn.prompt}
						</div>
						{turn.status === 'thinking' ? (
							<div className="w-fit flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-2 text-sm text-muted-foreground" role="status" aria-label="Thinking">
								<span className="sr-only">Thinking</span>
								{/* Three dots that light up one after another */}
								{[0, 0.2, 0.4].map((delay) => (
									<span key={delay} aria-hidden className="chat-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: `${delay}s` }} />
								))}
							</div>
						) : (
							<div data-role="assistant" className={turn.status === 'failed' ? 'text-destructive text-sm' : ''}>
								{/* The AI's own bubble, on the left */}
								<div className="mr-4 w-fit max-w-full rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
									<div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
										<ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.response}</ReactMarkdown>
									</div>
								</div>
								<div className="mt-1 flex items-center gap-0.5">
									<button type="button" className={tool} title="Copy" aria-label="Copy answer" onClick={() => navigator.clipboard?.writeText(turn.response)}>
										<Copy className="h-3.5 w-3.5" />
									</button>
									<button type="button" className={tool} title="Ask again" aria-label="Retry" disabled={thinking} onClick={() => send(turn.prompt)}>
										<RotateCcw className="h-3.5 w-3.5" />
									</button>
									<button
										type="button"
										className={tool}
										title="Edit the question"
										aria-label="Edit question"
										onClick={() => {
											setChatInput(turn.prompt);
											inputRef.current?.focus();
										}}>
										<Pencil className="h-3.5 w-3.5" />
									</button>
									<button type="button" className={tool} title="Save the question as a prompt" aria-label="Save question as prompt" onClick={() => openPrompts(turn.prompt)}>
										<BookmarkPlus className="h-3.5 w-3.5" />
									</button>
									<button type="button" className={tool} title="Download" aria-label="Download answer" onClick={() => downloadTurn(turn, filterState, safeSelectedNodes)}>
										<Download className="h-3.5 w-3.5" />
									</button>
									<button type="button" className={`${tool} ${turn.feedback === 'up' ? 'text-green-600' : ''}`} title="Good answer" aria-label="Good answer" aria-pressed={turn.feedback === 'up'} onClick={() => updateTurn(turn.id, { feedback: 'up' })}>
										<ThumbsUp className="h-3.5 w-3.5" />
									</button>
									<button type="button" className={`${tool} ${turn.feedback === 'down' ? 'text-red-600' : ''}`} title="Bad answer" aria-label="Bad answer" aria-pressed={turn.feedback === 'down'} onClick={() => updateTurn(turn.id, { feedback: 'down' })}>
										<ThumbsDown className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						)}
					</div>
				))}
				<div ref={endRef} />
			</div>

			{/* The box stays at the bottom while the conversation scrolls above it */}
			<div className="sticky bottom-0 -mx-4 px-4 pt-2 pb-3 bg-sidebar space-y-1.5">
				{contextSummary}
				{/* Like Claude's box: the text on top, a toolbar row inside along the bottom */}
				<div
					className="rounded-2xl border border-gray-300 bg-white shadow-sm transition-shadow focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
					onClick={() => inputRef.current?.focus()}>
					<textarea
						ref={inputRef}
						value={chatInput}
						onChange={(e) => setChatInput(e.target.value)}
						placeholder={CHAT_PLACEHOLDERS.default}
						aria-label="Ask about the documents"
						rows={1}
						className="block w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm leading-relaxed placeholder:text-gray-400 focus:outline-none"
						onKeyDown={(e) => {
							// Enter sends, Shift+Enter is a new line (not while an accent/IME is composing)
							if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
								e.preventDefault();
								send();
							}
							if (e.key === 'Escape' && thinking) stop();
						}}
					/>
					<div className="flex items-center gap-1.5 px-2 pb-2">
						{/* + opens every saved prompt: use, edit, delete, or save a new one */}
						<button
							type="button"
							onClick={() => openPrompts()}
							aria-label="Saved prompts"
							title="Saved prompts"
							className="h-7 w-7 shrink-0 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50">
							<Plus className="h-4 w-4" />
						</button>
						{savedPrompts.slice(0, CHIPS_SHOWN).map((p) => (
							<button
								key={p.id}
								type="button"
								disabled={thinking}
								title={p.text}
								onClick={() => fillBox(p.text)}
								className="max-w-32 truncate rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50">
								{p.name}
							</button>
						))}
						{thinking ? (
							<button type="button" onClick={stop} aria-label="Stop" title="Stop (Esc)" className="ml-auto h-8 w-8 shrink-0 rounded-lg bg-gray-900 text-white flex items-center justify-center">
								<Square className="h-3 w-3 fill-current" />
							</button>
						) : (
							<button type="button" onClick={() => send()} disabled={!chatInput.trim() || !canAsk} aria-label="Send" title={canAsk ? 'Send (Enter)' : contextNodes.length === 0 ? 'Add documents to context first' : `The AI takes up to ${PROMPT_CONFIG.MAX_NODES_PER_REQUEST} documents`} className="ml-auto h-8 w-8 shrink-0 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40">
								<ArrowUp className="h-4 w-4" />
							</button>
						)}
					</div>
				</div>
			</div>
			<SavedPromptsDialog
				open={promptsOpen}
				onOpenChange={(open) => {
					setPromptsOpen(open);
					if (!open) setSaveText(null);
				}}
				onUse={fillBox}
				draft={chatInput}
				saveText={saveText}
			/>
		</div>
	);
}
