'use client';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp, BookmarkPlus, Copy, FileText, Pencil, Plus, RotateCcw, Square, ThumbsDown, ThumbsUp } from 'lucide-react';
import { analyzeNodesLive } from '@/lib/api/analysis-client';
import { queryClient } from '@/lib/api/query-client';
import { ApiError, RETRY, shouldRetry } from '@/lib/api/http';
import { chatMemory, CHAT_LIMITS } from '@/lib/contracts/analysis';
import { useContextStore } from '@/lib/stores/context-store';
import { PROMPT_CONFIG } from '@/lib/prompts/analysis-prompts';
import { matchPrompts, recentPrompts, useSavedPrompts, type SavedPrompt } from '@/lib/stores/saved-prompts';
import { SavedPromptsDialog } from './SavedPromptsDialog';
import { ReceiptDialog } from './ReceiptDialog';
import { CoverageLink } from './CoverageLink';
import { ReadFolded, ReadingNow } from './ReadingNote';
import { DocumentView } from './DocumentView';
import { documentTitle } from '@/lib/chat/citations';
import { useAppStore } from '@/lib/stores/app-state';
import { useWorkspaceGoal } from '@/lib/workspace/keep';
import { actionOptionsFromStore, applyAction, previewCount } from '@/lib/chat/actions';
import type { ChatAction } from '@/lib/contracts/analysis';
import { ActionButton } from './ActionButton';
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

/**
 * The chat: questions about the documents in context. Laid out like a chat
 * app (newest at the bottom, box underneath); follow-ups remember the last
 * few turns, and Stop really cancels.
 */
export default function ChatInterface({ rightPanelExpanded, contextSummary }: ChatInterfaceProps) {
	const [chatInput, setChatInput] = useState('');
	const savedPrompts = useSavedPrompts((s) => s.prompts);
	// An answer opened as a document: beside the chat when the panel is wide, over it when narrow
	const [openDocId, setOpenDocId] = useState<string | null>(null);
	// The answer whose receipt ("What was sent") is open
	const [receiptId, setReceiptId] = useState<string | null>(null);
	// Clicked action buttons, with how to undo each ("turnId:index")
	const [applied, setApplied] = useState<Record<string, { action: ChatAction; undo: () => void }>>({});
	// Suggestion counts follow the filters, so re-draw when they change
	useAppStore((s) => s.filteredResults);
	const [docFull, setDocFull] = useState(false);
	const setRightPanelExpanded = useAppStore((s) => s.setRightPanelExpanded);
	const touchPrompt = useSavedPrompts((s) => s.touchPrompt);
	// The "/" menu: open while the box starts with "/" (one line), until Esc closes it
	const [slashIndex, setSlashIndex] = useState(0);
	const [slashClosed, setSlashClosed] = useState(false);
	const slashOpen = chatInput.startsWith('/') && !chatInput.includes('\n') && !slashClosed;
	const slashMatches = slashOpen ? matchPrompts(savedPrompts, chatInput.slice(1)) : [];
	const slashListRef = useRef<HTMLUListElement>(null);
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
	const analyze = useMutation({ mutationFn: analyzeNodesLive, retry: shouldRetry, retryDelay: RETRY.DELAY_MS }, queryClient);

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
				const { summary, actions, receipt } = await analyze.mutateAsync({
					nodes: contextNodes.map(toAnalysisNode),
					customPrompt: prompt,
					history: memory,
					goal: useWorkspaceGoal.getState().goal || undefined,
					// What the answer may suggest changing, as buttons
					actionOptions: actionOptionsFromStore(),
					signal: controller.signal,
					// Each document the AI opens shows in the thinking bubble as it happens
					onRead: ({ title, round }) => {
						const sofar = useContextStore.getState().chatConversations.find((c) => c.id === id)?.reading ?? [];
						updateTurn(id, { reading: [...sofar, { title, round }] });
					},
				});
				updateTurn(id, { response: summary, actions, receipt, status: 'done' });
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
	const fillText = (text: string) => {
		setChatInput(text);
		requestAnimationFrame(() => inputRef.current?.focus());
	};
	const fillBox = (prompt: SavedPrompt) => {
		touchPrompt(prompt.id);
		fillText(prompt.text);
	};

	// The box grows upward with what you type, up to about 8 lines, then scrolls inside
	useEffect(() => {
		const box = inputRef.current;
		if (!box) return;
		box.style.height = 'auto';
		box.style.height = `${Math.min(box.scrollHeight, MAX_BOX_PX)}px`;
		box.style.overflowY = box.scrollHeight > MAX_BOX_PX ? 'auto' : 'hidden';
	}, [chatInput]);

	// The highlighted prompt in the "/" list stays in view as the arrows move past the edge
	useEffect(() => {
		slashListRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
	}, [slashIndex, slashOpen]);

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

	const openTurn = conversations.find((c) => c.id === openDocId && c.status === 'done');
	const split = Boolean(openTurn) && rightPanelExpanded && !docFull;

	const chat = (
		<div
			data-testid="chat"
			// Wide: a comfortable reading column in the middle instead of edge to edge
			className={`flex flex-col min-h-[calc(100vh-5rem)] ${rightPanelExpanded && !split ? 'w-full max-w-3xl mx-auto px-6' : ''}`}>
			{/* Messages, oldest first */}
			<div className="flex-1 space-y-4 pb-4">
				{conversations.length === 0 && (
					<p className="pt-8 text-center text-sm text-muted-foreground">
						Ask about the documents in context. Follow-up questions remember the last {CHAT_LIMITS.MEMORY_TURNS} answers.
					</p>
				)}
				{conversations.map((turn) => (
					<div key={turn.id} className="space-y-2" data-chat-turn>
						<div className="flex flex-col items-end gap-0.5">
							<div className="w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary/10 px-4 py-2 text-sm whitespace-pre-wrap" data-role="user">
								{turn.prompt}
							</div>
							{/* Tools for the question itself: ask again, edit, save as a prompt */}
							<div className="flex items-center gap-0.5">
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
							</div>
						</div>
						{turn.status === 'thinking' ? (
							<div className="w-fit max-w-full flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-2 text-sm text-muted-foreground" role="status" aria-label="Thinking">
								<span className="sr-only">Thinking</span>
								{/* Three dots that light up one after another */}
								{[0, 0.2, 0.4].map((delay) => (
									<span key={delay} aria-hidden className="chat-dot h-2 w-2 rounded-full bg-primary" style={{ animationDelay: `${delay}s` }} />
								))}
								{(turn.reading?.length ?? 0) > 0 && <ReadingNow reading={turn.reading!} />}
							</div>
						) : (
							<div data-role="assistant" className={turn.status === 'failed' ? 'text-destructive text-sm' : ''}>
								{/* What it read in full, folded: "Read 3 documents in full ▸" */}
								{turn.status === 'done' && <ReadFolded turn={turn} />}
								{/* The AI's own bubble, on the left */}
								<div className="mr-4 w-fit max-w-full rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
									<div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
										<ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.response}</ReactMarkdown>
									</div>
								</div>
								{/* Suggested actions: nothing changes until clicked; Undo puts it back */}
								{turn.status === 'done' && (turn.actions?.length ?? 0) > 0 && (
									<div className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggested actions">
										{turn.actions!.map((action, i) => {
											const key = `${turn.id}:${i}`;
											// A filter that would leave nothing isn't worth offering
											if (!applied[key] && previewCount(action) === 0) return null;
											return (
												<ActionButton
													key={key}
													action={action}
													applied={applied[key]?.action}
													onApply={(chosen) => setApplied((prev) => ({ ...prev, [key]: { action: chosen, undo: applyAction(chosen) } }))}
													onUndo={() => {
														applied[key]?.undo();
														setApplied((prev) => {
															const next = { ...prev };
															delete next[key];
															return next;
														});
													}}
												/>
											);
										})}
									</div>
								)}
								<div className="mt-1 flex items-center gap-0.5">
									{/* Opens the answer as a document */}
									{turn.status === 'done' && (
										<button
											type="button"
											className={`${tool} ${openDocId === turn.id ? 'bg-primary/10 text-primary' : ''}`}
											title="Open as a document"
											aria-label={`Open ${documentTitle(turn.response, turn.prompt)} as a document`}
											aria-pressed={openDocId === turn.id}
											onClick={() => setOpenDocId(turn.id)}>
											<FileText className="h-3.5 w-3.5" />
										</button>
									)}
									<button type="button" className={tool} title="Copy" aria-label="Copy answer" onClick={() => navigator.clipboard?.writeText(turn.response)}>
										<Copy className="h-3.5 w-3.5" />
									</button>
									<button type="button" className={`${tool} ${turn.feedback === 'up' ? 'text-green-600' : ''}`} title="Good answer" aria-label="Good answer" aria-pressed={turn.feedback === 'up'} onClick={() => updateTurn(turn.id, { feedback: 'up' })}>
										<ThumbsUp className="h-3.5 w-3.5" />
									</button>
									<button type="button" className={`${tool} ${turn.feedback === 'down' ? 'text-red-600' : ''}`} title="Bad answer" aria-label="Bad answer" aria-pressed={turn.feedback === 'down'} onClick={() => updateTurn(turn.id, { feedback: 'down' })}>
										<ThumbsDown className="h-3.5 w-3.5" />
									</button>
									{/* Which of the documents sent the answer cites; opens the receipt */}
									{turn.status === 'done' && turn.receipt && (
										<CoverageLink answer={turn.response} receipt={turn.receipt} onOpenReceipt={() => setReceiptId(turn.id)} />
									)}
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
				{/* The "/" menu, just above the box */}
				{slashOpen && (
					<ul
						id="slash-menu"
						ref={slashListRef}
						role="listbox"
						aria-label="Saved prompts matching"
						className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
						{slashMatches.length === 0 ? (
							<li className="px-3 py-2 text-xs text-muted-foreground">No saved prompt matches. Enter sends it as a question.</li>
						) : (
							slashMatches.map((p, i) => (
								<li
									key={p.id}
									role="option"
									aria-selected={i === slashIndex}
									onMouseDown={(e) => {
										e.preventDefault();
										fillBox(p);
									}}
									onMouseEnter={() => setSlashIndex(i)}
									className={`cursor-pointer rounded-lg px-3 py-1.5 ${i === slashIndex ? 'bg-primary/10' : ''}`}>
									<span className="block text-sm font-medium">{p.name}</span>
									<span className="text-xs text-muted-foreground line-clamp-1">{p.text}</span>
								</li>
							))
						)}
					</ul>
				)}
				{/* Like Claude's box: the text on top, a toolbar row inside along the bottom */}
				<div
					className="rounded-2xl border border-gray-300 bg-white shadow-sm transition-shadow focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
					onClick={() => inputRef.current?.focus()}>
					<textarea
						ref={inputRef}
						value={chatInput}
						onChange={(e) => {
							setChatInput(e.target.value);
							setSlashIndex(0);
							if (!e.target.value.startsWith('/')) setSlashClosed(false);
						}}
						placeholder="Ask about the documents, or type / for saved prompts"
						aria-controls={slashOpen ? 'slash-menu' : undefined}
						aria-label="Ask about the documents"
						rows={1}
						className="block w-full resize-none bg-transparent px-4 pt-3 pb-1 text-sm leading-relaxed placeholder:text-gray-400 focus:outline-none"
						onKeyDown={(e) => {
							// The "/" menu takes the arrow keys, Enter/Tab to pick, Esc to close
							if (slashOpen && slashMatches.length > 0) {
								const pick = { ArrowDown: 1, ArrowUp: -1 }[e.key as 'ArrowDown' | 'ArrowUp'];
								if (pick) {
									e.preventDefault();
									setSlashIndex((i) => (i + pick + slashMatches.length) % slashMatches.length);
									return;
								}
								if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
									e.preventDefault();
									fillBox(slashMatches[Math.min(slashIndex, slashMatches.length - 1)]);
									return;
								}
							}
							if (e.key === 'Escape' && slashOpen) {
								setSlashClosed(true);
								return;
							}
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
						{/* Your most recently used or saved prompts */}
						{recentPrompts(savedPrompts, CHIPS_SHOWN).map((p) => (
							<button
								key={p.id}
								type="button"
								disabled={thinking}
								title={p.text}
								onClick={() => fillBox(p)}
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
			<ReceiptDialog
				receipt={conversations.find((c) => c.id === receiptId)?.receipt ?? null}
				answer={conversations.find((c) => c.id === receiptId)?.response ?? ''}
				onClose={() => setReceiptId(null)}
			/>
		</div>
	);

	if (!openTurn) return chat;

	const doc = (
		<DocumentView
			key={openTurn.id}
			question={openTurn.prompt}
			answer={openTurn.response}
			// Only "full" when wide and filling the panel; then ⤢ brings the chat back beside it
			full={rightPanelExpanded && docFull}
			// Narrow: widen into the split view. Wide: fill the panel, or go back to the split
			onExpand={() => (rightPanelExpanded ? setDocFull(!docFull) : setRightPanelExpanded(true))}
			onClose={() => {
				setOpenDocId(null);
				setDocFull(false);
			}}
		/>
	);

	// Narrow panel, or expanded: the document on its own
	if (!split) return <div className="h-[calc(100vh-5rem)]">{doc}</div>;

	// Wide: the chat on the left, the document on the right (it stays put while the chat scrolls)
	return (
		<div className="flex gap-4">
			<div className="w-2/5 min-w-0">{chat}</div>
			<div className="sticky top-16 h-[calc(100vh-5rem)] min-w-0 flex-1 self-start">{doc}</div>
		</div>
	);
}
